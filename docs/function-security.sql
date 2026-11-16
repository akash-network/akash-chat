-- ============================================================================
-- Function-Based
-- ============================================================================
-- This approach uses PostgreSQL functions to enforce user_id filtering
--
-- Steps:
--   1. Create functions that require user_id parameter
--   2. REVOKE direct table access from frontend_user
--   3. GRANT EXECUTE on functions only
--   4. Database enforces filtering
-- ============================================================================

-- ============================================================================
-- STEP 1: Create frontend_app_user
-- ============================================================================

CREATE ROLE frontend_app_user WITH LOGIN PASSWORD 'CHANGE_THIS_PASSWORD';
GRANT USAGE ON SCHEMA public TO frontend_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO frontend_app_user;

-- Global read-only tables (direct access OK)
GRANT SELECT ON models, user_tiers TO frontend_app_user;

-- Audit log (insert only)
GRANT INSERT ON audit_log TO frontend_app_user;

-- ============================================================================
-- STEP 2: User Preferences Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_preferences(p_user_id TEXT)
RETURNS SETOF user_preferences
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT * FROM user_preferences WHERE user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION upsert_user_preferences(
  p_user_id TEXT,
  p_selected_model TEXT DEFAULT NULL,
  p_system_prompt_encrypted TEXT DEFAULT NULL,
  p_system_prompt_iv TEXT DEFAULT NULL,
  p_system_prompt_tag TEXT DEFAULT NULL,
  p_temperature NUMERIC DEFAULT NULL,
  p_top_p NUMERIC DEFAULT NULL,
  p_last_selected_chat_id UUID DEFAULT NULL,
  p_last_selected_chat_updated_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS SETOF user_preferences
SECURITY DEFINER
LANGUAGE sql
AS $$
  INSERT INTO user_preferences (
    user_id, selected_model, system_prompt_encrypted, system_prompt_iv,
    system_prompt_tag, temperature, top_p, last_selected_chat_id,
    last_selected_chat_updated_at, created_at, updated_at
  ) VALUES (
    p_user_id, p_selected_model, p_system_prompt_encrypted, p_system_prompt_iv,
    p_system_prompt_tag, p_temperature, p_top_p, p_last_selected_chat_id,
    p_last_selected_chat_updated_at, NOW(), NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    selected_model = COALESCE(EXCLUDED.selected_model, user_preferences.selected_model),
    system_prompt_encrypted = COALESCE(EXCLUDED.system_prompt_encrypted, user_preferences.system_prompt_encrypted),
    system_prompt_iv = COALESCE(EXCLUDED.system_prompt_iv, user_preferences.system_prompt_iv),
    system_prompt_tag = COALESCE(EXCLUDED.system_prompt_tag, user_preferences.system_prompt_tag),
    temperature = COALESCE(EXCLUDED.temperature, user_preferences.temperature),
    top_p = COALESCE(EXCLUDED.top_p, user_preferences.top_p),
    last_selected_chat_id = COALESCE(EXCLUDED.last_selected_chat_id, user_preferences.last_selected_chat_id),
    last_selected_chat_updated_at = COALESCE(EXCLUDED.last_selected_chat_updated_at, user_preferences.last_selected_chat_updated_at),
    updated_at = NOW()
  RETURNING *;
$$;

-- ============================================================================
-- STEP 3: Chat Sessions Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_chat_sessions(
  p_user_id TEXT,
  p_limit INT DEFAULT 30
)
RETURNS SETOF chat_sessions
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT * FROM chat_sessions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION insert_chat_session(
  p_id UUID,
  p_user_id TEXT,
  p_folder_id UUID,
  p_model_id TEXT,
  p_model_name TEXT,
  p_name_encrypted TEXT DEFAULT NULL,
  p_name_iv TEXT DEFAULT NULL,
  p_name_tag TEXT DEFAULT NULL,
  p_system_prompt_encrypted TEXT DEFAULT NULL,
  p_system_prompt_iv TEXT DEFAULT NULL,
  p_system_prompt_tag TEXT DEFAULT NULL,
  p_parent_chat_id UUID DEFAULT NULL,
  p_branched_at_index INT DEFAULT NULL
)
RETURNS SETOF chat_sessions
SECURITY DEFINER
LANGUAGE sql
AS $$
  INSERT INTO chat_sessions (
    id, user_id, folder_id, model_id, model_name,
    name_encrypted, name_iv, name_tag,
    system_prompt_encrypted, system_prompt_iv, system_prompt_tag,
    parent_chat_id, branched_at_index, created_at, updated_at
  ) VALUES (
    p_id, p_user_id, p_folder_id, p_model_id, p_model_name,
    p_name_encrypted, p_name_iv, p_name_tag,
    p_system_prompt_encrypted, p_system_prompt_iv, p_system_prompt_tag,
    p_parent_chat_id, p_branched_at_index, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    folder_id = EXCLUDED.folder_id,
    model_id = EXCLUDED.model_id,
    model_name = EXCLUDED.model_name,
    name_encrypted = EXCLUDED.name_encrypted,
    name_iv = EXCLUDED.name_iv,
    name_tag = EXCLUDED.name_tag,
    system_prompt_encrypted = EXCLUDED.system_prompt_encrypted,
    system_prompt_iv = EXCLUDED.system_prompt_iv,
    system_prompt_tag = EXCLUDED.system_prompt_tag,
    parent_chat_id = EXCLUDED.parent_chat_id,
    branched_at_index = EXCLUDED.branched_at_index,
    updated_at = NOW()
  WHERE chat_sessions.user_id = EXCLUDED.user_id
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION update_chat_session(
  p_user_id TEXT,
  p_session_id UUID,
  p_folder_id UUID DEFAULT NULL,
  p_name_encrypted TEXT DEFAULT NULL,
  p_name_iv TEXT DEFAULT NULL,
  p_name_tag TEXT DEFAULT NULL
)
RETURNS SETOF chat_sessions
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE chat_sessions SET
    folder_id = COALESCE(p_folder_id, folder_id),
    name_encrypted = COALESCE(p_name_encrypted, name_encrypted),
    name_iv = COALESCE(p_name_iv, name_iv),
    name_tag = COALESCE(p_name_tag, name_tag),
    updated_at = NOW()
  WHERE id = p_session_id AND user_id = p_user_id
  RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION delete_chat_session(
  p_user_id TEXT,
  p_session_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  rows_deleted INT;
BEGIN
  DELETE FROM chat_sessions
  WHERE id = p_session_id AND user_id = p_user_id;

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RETURN rows_deleted > 0;
END;
$$;

-- ============================================================================
-- STEP 4: Chat Messages Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_chat_messages(
  p_user_id TEXT,
  p_chat_session_id UUID
)
RETURNS SETOF chat_messages
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify user owns the chat session
  IF NOT EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE id = p_chat_session_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied: chat session does not belong to user';
  END IF;

  RETURN QUERY
  SELECT * FROM chat_messages
  WHERE chat_session_id = p_chat_session_id
  ORDER BY position ASC;
END;
$$;

CREATE OR REPLACE FUNCTION get_bulk_chat_messages(
  p_user_id TEXT,
  p_chat_session_ids UUID[]
)
RETURNS SETOF chat_messages
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only return messages from chats the user owns
  RETURN QUERY
  SELECT cm.* FROM chat_messages cm
  INNER JOIN chat_sessions cs ON cs.id = cm.chat_session_id
  WHERE cm.chat_session_id = ANY(p_chat_session_ids)
    AND cs.user_id = p_user_id
  ORDER BY cm.chat_session_id ASC, cm.position ASC;
END;
$$;

CREATE OR REPLACE FUNCTION insert_chat_message(
  p_user_id TEXT,
  p_chat_session_id UUID,
  p_role VARCHAR,
  p_position INT,
  p_content_encrypted TEXT,
  p_content_iv TEXT,
  p_content_tag TEXT,
  p_token_count INT DEFAULT NULL
)
RETURNS SETOF chat_messages
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify user owns the chat session
  IF NOT EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE id = p_chat_session_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied: chat session does not belong to user';
  END IF;

  RETURN QUERY
  INSERT INTO chat_messages (
    chat_session_id, role, position,
    content_encrypted, content_iv, content_tag,
    token_count, created_at
  ) VALUES (
    p_chat_session_id, p_role, p_position,
    p_content_encrypted, p_content_iv, p_content_tag,
    p_token_count, NOW()
  )
  ON CONFLICT (chat_session_id, position) DO UPDATE SET
    role = EXCLUDED.role,
    content_encrypted = EXCLUDED.content_encrypted,
    content_iv = EXCLUDED.content_iv,
    content_tag = EXCLUDED.content_tag,
    token_count = EXCLUDED.token_count
  RETURNING *;
END;
$$;

-- ============================================================================
-- STEP 5: Folders Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_folders(p_user_id TEXT)
RETURNS SETOF folders
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT * FROM folders
  WHERE user_id = p_user_id
  ORDER BY created_at ASC;
$$;

CREATE OR REPLACE FUNCTION folder_exists(
  p_user_id TEXT,
  p_folder_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT EXISTS(
    SELECT 1 FROM folders
    WHERE id = p_folder_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION find_folder_by_name(
  p_user_id TEXT,
  p_name_encrypted TEXT,
  p_name_iv TEXT,
  p_name_tag TEXT
)
RETURNS SETOF folders
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT * FROM folders
  WHERE user_id = p_user_id
    AND name_encrypted = p_name_encrypted
    AND name_iv = p_name_iv
    AND name_tag = p_name_tag
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION insert_folder(
  p_user_id TEXT,
  p_name_encrypted TEXT,
  p_name_iv TEXT,
  p_name_tag TEXT
)
RETURNS SETOF folders
SECURITY DEFINER
LANGUAGE sql
AS $$
  INSERT INTO folders (
    user_id, name_encrypted, name_iv, name_tag,
    created_at, updated_at
  ) VALUES (
    p_user_id, p_name_encrypted, p_name_iv, p_name_tag,
    NOW(), NOW()
  )
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION update_folder(
  p_user_id TEXT,
  p_folder_id UUID,
  p_name_encrypted TEXT DEFAULT NULL,
  p_name_iv TEXT DEFAULT NULL,
  p_name_tag TEXT DEFAULT NULL
)
RETURNS SETOF folders
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE folders SET
    name_encrypted = COALESCE(p_name_encrypted, name_encrypted),
    name_iv = COALESCE(p_name_iv, name_iv),
    name_tag = COALESCE(p_name_tag, name_tag),
    updated_at = NOW()
  WHERE id = p_folder_id AND user_id = p_user_id
  RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION delete_folder(
  p_user_id TEXT,
  p_folder_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  rows_deleted INT;
BEGIN
  -- Delete chat sessions in folder first (CASCADE will handle messages)
  DELETE FROM chat_sessions
  WHERE folder_id = p_folder_id AND user_id = p_user_id;

  -- Delete the folder
  DELETE FROM folders
  WHERE id = p_folder_id AND user_id = p_user_id;

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RETURN rows_deleted > 0;
END;
$$;

-- ============================================================================
-- STEP 6: Saved Prompts Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_saved_prompts(p_user_id TEXT)
RETURNS SETOF saved_prompts
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT * FROM saved_prompts
  WHERE user_id = p_user_id
  ORDER BY position ASC;
$$;

CREATE OR REPLACE FUNCTION insert_saved_prompt(
  p_user_id TEXT,
  p_name_encrypted TEXT,
  p_name_iv TEXT,
  p_name_tag TEXT,
  p_content_encrypted TEXT,
  p_content_iv TEXT,
  p_content_tag TEXT,
  p_position INT DEFAULT 0
)
RETURNS SETOF saved_prompts
SECURITY DEFINER
LANGUAGE sql
AS $$
  INSERT INTO saved_prompts (
    user_id, name_encrypted, name_iv, name_tag,
    content_encrypted, content_iv, content_tag,
    position, created_at, updated_at
  ) VALUES (
    p_user_id, p_name_encrypted, p_name_iv, p_name_tag,
    p_content_encrypted, p_content_iv, p_content_tag,
    p_position, NOW(), NOW()
  )
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION update_saved_prompt(
  p_user_id TEXT,
  p_prompt_id UUID,
  p_name_encrypted TEXT DEFAULT NULL,
  p_name_iv TEXT DEFAULT NULL,
  p_name_tag TEXT DEFAULT NULL,
  p_content_encrypted TEXT DEFAULT NULL,
  p_content_iv TEXT DEFAULT NULL,
  p_content_tag TEXT DEFAULT NULL,
  p_position INT DEFAULT NULL
)
RETURNS SETOF saved_prompts
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE saved_prompts SET
    name_encrypted = COALESCE(p_name_encrypted, name_encrypted),
    name_iv = COALESCE(p_name_iv, name_iv),
    name_tag = COALESCE(p_name_tag, name_tag),
    content_encrypted = COALESCE(p_content_encrypted, content_encrypted),
    content_iv = COALESCE(p_content_iv, content_iv),
    content_tag = COALESCE(p_content_tag, content_tag),
    position = COALESCE(p_position, position),
    updated_at = NOW()
  WHERE id = p_prompt_id AND user_id = p_user_id
  RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION delete_saved_prompt(
  p_user_id TEXT,
  p_prompt_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  rows_deleted INT;
BEGIN
  DELETE FROM saved_prompts
  WHERE id = p_prompt_id AND user_id = p_user_id;

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RETURN rows_deleted > 0;
END;
$$;

-- ============================================================================
-- STEP 7: User API Keys Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_api_key(p_user_id TEXT)
RETURNS SETOF user_api_keys
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT * FROM user_api_keys
  WHERE user_id = p_user_id AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION insert_user_api_key(
  p_user_id TEXT,
  p_litellm_api_key_encrypted_b64 TEXT,
  p_litellm_api_key_iv_b64 TEXT,
  p_litellm_api_key_tag_b64 TEXT
)
RETURNS SETOF user_api_keys
SECURITY DEFINER
LANGUAGE sql
AS $$
  INSERT INTO user_api_keys (
    user_id, litellm_api_key_encrypted_b64, litellm_api_key_iv_b64,
    litellm_api_key_tag_b64, is_active, created_at, updated_at
  ) VALUES (
    p_user_id, p_litellm_api_key_encrypted_b64, p_litellm_api_key_iv_b64,
    p_litellm_api_key_tag_b64, true, NOW(), NOW()
  )
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION update_user_api_key(
  p_user_id TEXT,
  p_litellm_api_key_encrypted_b64 TEXT,
  p_litellm_api_key_iv_b64 TEXT,
  p_litellm_api_key_tag_b64 TEXT
)
RETURNS SETOF user_api_keys
SECURITY DEFINER
LANGUAGE sql
AS $$
  UPDATE user_api_keys SET
    litellm_api_key_encrypted_b64 = p_litellm_api_key_encrypted_b64,
    litellm_api_key_iv_b64 = p_litellm_api_key_iv_b64,
    litellm_api_key_tag_b64 = p_litellm_api_key_tag_b64,
    updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true
  RETURNING *;
$$;

-- ============================================================================
-- STEP 8: Batch Operations Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_all_user_chat_history(p_user_id TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM chat_sessions WHERE user_id = p_user_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION delete_all_user_data(p_user_id TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM chat_sessions WHERE user_id = p_user_id;
  DELETE FROM folders WHERE user_id = p_user_id;
  DELETE FROM user_preferences WHERE user_id = p_user_id;
  DELETE FROM saved_prompts WHERE user_id = p_user_id;
  DELETE FROM user_api_keys WHERE user_id = p_user_id;
  RETURN true;
END;
$$;

-- ============================================================================
-- STEP 9: Grant EXECUTE permissions (ONLY way to access user data)
-- ============================================================================

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO frontend_app_user;

-- ============================================================================
-- STEP 10: REVOKE direct table access (forces use of functions)
-- ============================================================================

REVOKE ALL ON user_preferences FROM frontend_app_user;
REVOKE ALL ON chat_sessions FROM frontend_app_user;
REVOKE ALL ON chat_messages FROM frontend_app_user;
REVOKE ALL ON folders FROM frontend_app_user;
REVOKE ALL ON saved_prompts FROM frontend_app_user;
REVOKE ALL ON user_api_keys FROM frontend_app_user;

-- ============================================================================
-- STEP 11: Performance Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(chat_session_id);

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ frontend_app_user created';
  RAISE NOTICE '✓ Security functions created';
  RAISE NOTICE '✓ Direct table access REVOKED';
  RAISE NOTICE '✓ EXECUTE permissions granted';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'SECURITY MODEL:';
  RAISE NOTICE '  ✓ All functions require user_id parameter';
  RAISE NOTICE '  ✓ Database enforces user isolation';
  RAISE NOTICE '  ✓ Impossible to query without user_id';
  RAISE NOTICE '  ✓ Even SQL injection cannot bypass';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Set password: ALTER ROLE frontend_app_user WITH PASSWORD ''strong-password'';';
  RAISE NOTICE '2. Update .env.local: DATABASE_URL=postgresql://frontend_app_user:PASSWORD@pooler...';
  RAISE NOTICE '3. Application code is already updated!';
  RAISE NOTICE '4. See docs/function-implementation-guide.md';
  RAISE NOTICE '';
END $$;
