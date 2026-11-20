import { NextRequest } from 'next/server';

import { 
  syncUserSettingsToDatabase, 
  syncUserSettingsFromDatabase,
  saveEncryptedUserPreferences,
  getDecryptedUserPreferences,
  saveEncryptedPrompt,
  getDecryptedSavedPrompts,
  updateEncryptedPrompt,
  deleteEncryptedPrompt,
  reorderEncryptedPrompts
} from '@/lib/encrypted-user-settings';
import { requireAuth } from '@/lib/middleware/auth';
import { withErrorHandling, createSuccessResponse, validateRequestBody, ValidationError } from '@/lib/middleware/error-handler';

// Each prompt is a separate encrypt + write, so bound the work a single request can queue
const MAX_PROMPTS_PER_REQUEST = 500;

export const GET = withErrorHandling(
  requireAuth(async (_request: NextRequest, userId: string, _user: any) => {
    const [preferences, savedPrompts] = await Promise.all([
      getDecryptedUserPreferences(userId),
      getDecryptedSavedPrompts(userId)
    ]);
    
    return createSuccessResponse({
      preferences,
      savedPrompts
    });
  })
);

export const POST = withErrorHandling(
  requireAuth(async (_request: NextRequest, userId: string, _user: any) => {
    const { action, data } = await validateRequestBody(_request, ['action']);

    if (!action || typeof action !== 'string') {
      throw new ValidationError('Action is required and must be a string');
    }

    switch (action) {
      case 'sync_to_database':
        if (Array.isArray(data?.localStorageData?.savedPrompts) && data.localStorageData.savedPrompts.length > MAX_PROMPTS_PER_REQUEST) {
          throw new ValidationError(`At most ${MAX_PROMPTS_PER_REQUEST} prompts can be synced per request`);
        }
        await syncUserSettingsToDatabase(userId, data?.localStorageData);
        return createSuccessResponse({ message: 'Settings synced to database' });

      case 'sync_from_database':
        await syncUserSettingsFromDatabase(userId);
        return createSuccessResponse({ message: 'Settings synced from database' });

      case 'save_preferences':
        if (!data) {
          throw new ValidationError('Preferences data is required');
        }
        await saveEncryptedUserPreferences(userId, data);
        return createSuccessResponse({ message: 'Preferences saved' });

      case 'save_prompt': {
        if (!data?.name || !data?.content) {
          throw new ValidationError('Prompt name and content are required');
        }
        const promptId = await saveEncryptedPrompt(
          userId, 
          data.name, 
          data.content, 
        );
        return createSuccessResponse({ 
          promptId,
          message: 'Prompt saved' 
        });
      }

      case 'update_prompt':
        if (!data?.promptId || !data?.updates) {
          throw new ValidationError('Prompt ID and updates are required');
        }
        await updateEncryptedPrompt(data.promptId, userId, data.updates);
        return createSuccessResponse({ message: 'Prompt updated' });

      case 'delete_prompt':
        if (!data?.promptId) {
          throw new ValidationError('Prompt ID is required');
        }
        await deleteEncryptedPrompt(userId, data.promptId);
        return createSuccessResponse({ message: 'Prompt deleted' });

      case 'reorder_prompts':
        if (!data?.promptIds || !Array.isArray(data.promptIds)) {
          throw new ValidationError('Prompt IDs array is required');
        }
        if (data.promptIds.length > MAX_PROMPTS_PER_REQUEST) {
          throw new ValidationError(`At most ${MAX_PROMPTS_PER_REQUEST} prompts can be reordered per request`);
        }
        await reorderEncryptedPrompts(userId, data.promptIds);
        return createSuccessResponse({ message: 'Prompts reordered' });

      default:
        throw new ValidationError(`Invalid action: ${action}`);
    }
  })
);