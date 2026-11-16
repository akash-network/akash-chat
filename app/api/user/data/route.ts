import { NextRequest, NextResponse } from 'next/server';

import { getDecryptedSavedPrompts } from '@/lib/encrypted-user-settings';
import { requireAuth } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/error-handler';
import { createDatabaseService } from '@/lib/services/database-service';
import { createEncryptionService } from '@/lib/services/encryption-service';

export const GET = withErrorHandling(
  requireAuth(async (request: NextRequest, userId: string, _user: any) => {

    // Parse pagination parameters
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100); // Max 100 chats
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Create services
    const dbService = createDatabaseService(userId);
    const encryptionService = createEncryptionService(userId);

    // Load all data in parallel using database service
    const [preferencesResult, chatsResult, foldersResult, savedPrompts] = await Promise.all([
      dbService.loadUserPreferences(),
      dbService.loadUserChats(),
      dbService.loadUserFolders(),
      getDecryptedSavedPrompts(userId)
    ]);

    // Handle preferences (system prompt will be decrypted in batch later)
    let preferences = null;
    let preferencesSystemPromptIndex = -1;
    if (preferencesResult.success && preferencesResult.data) {
      const prefs = preferencesResult.data;
      preferences = {
        selectedModel: prefs.selected_model,
        systemPrompt: '', // Will be decrypted in batch operation
        temperature: typeof prefs.temperature === 'string' ? parseFloat(prefs.temperature) : prefs.temperature,
        topP: typeof prefs.top_p === 'string' ? parseFloat(prefs.top_p) : prefs.top_p
      };
    }

    // Handle folders
    const folders = foldersResult.success ? (foldersResult.data || []).map(folder => ({
      id: folder.id,
      name: folder.name,
      created_at: folder.created_at,
      updated_at: folder.updated_at
    })) : [];

    // Process chat sessions with their messages using bulk operations
    const processedChats = [];
    
    if (chatsResult.success && chatsResult.data && chatsResult.data.length > 0) {
      try {
        // Apply pagination to chats
        const allChats = chatsResult.data;
        const paginatedChats = allChats.slice(offset, offset + limit);
        
        // Bulk load all messages for paginated chats only
        const chatIds = paginatedChats.map(chat => chat.id).filter((id): id is string => !!id);
        const bulkMessagesResult = await dbService.loadBulkChatMessages(chatIds);
        
        if (bulkMessagesResult.success && bulkMessagesResult.data) {
          const messagesByChat = bulkMessagesResult.data;

          // Collect ALL encrypted data for a single batch decryption
          const allEncryptedData = [];
          const allSystemPromptData = [];
          const messageMapping = new Map();
          const systemPromptMapping = new Map();
          const allNames = [];
          const nameMapping = new Map();

          // Add preferences system prompt to batch if it exists
          if (preferencesResult.success && preferencesResult.data) {
            const prefs = preferencesResult.data;
            if (prefs.system_prompt_encrypted && prefs.system_prompt_iv && prefs.system_prompt_tag) {
              preferencesSystemPromptIndex = allSystemPromptData.length;
              allSystemPromptData.push({
                content_encrypted: prefs.system_prompt_encrypted,
                content_iv: prefs.system_prompt_iv,
                content_tag: prefs.system_prompt_tag
              });
            }
          }

          // First pass: collect all encrypted data
          for (const chat of paginatedChats) {
            const chatMessages = messagesByChat.get(chat.id!) || [];
            const chatMessageData = [];
            
            for (const msg of chatMessages) {
              if (msg.content_encrypted && msg.content_iv && msg.content_tag) {
                const dataIndex = allEncryptedData.length;
                allEncryptedData.push({
                  content_encrypted: msg.content_encrypted,
                  content_iv: msg.content_iv,
                  content_tag: msg.content_tag
                });
                chatMessageData.push({
                  id: msg.id,
                  role: msg.role,
                  createdAt: msg.created_at,
                  dataIndex,
                  hasEncryption: true
                });
              } else {
                chatMessageData.push({
                  id: msg.id,
                  role: msg.role,
                  createdAt: msg.created_at,
                  hasEncryption: false
                });
              }
            }
            
            messageMapping.set(chat.id!, chatMessageData);

            // Collect system prompt data
            if (chat.system_prompt_encrypted && chat.system_prompt_iv && chat.system_prompt_tag) {
              const systemIndex = allSystemPromptData.length;
              allSystemPromptData.push({
                content_encrypted: chat.system_prompt_encrypted,
                content_iv: chat.system_prompt_iv,
                content_tag: chat.system_prompt_tag
              });
              systemPromptMapping.set(chat.id!, systemIndex);
            }

            // decrypt name
            if (chat.name_encrypted && chat.name_iv && chat.name_tag) {
              const nameIndex = allNames.length;
              allNames.push({
                content_encrypted: chat.name_encrypted,
                content_iv: chat.name_iv,
                content_tag: chat.name_tag
              });
              nameMapping.set(chat.id!, nameIndex);
            }
          }

          // Single batch decryption for ALL messages and system prompts
          const [messageDecryptResults, systemPromptResults, nameDecryptResults] = await Promise.all([
            allEncryptedData.length > 0 ? encryptionService.decryptBatchSafe(allEncryptedData) : Promise.resolve([]),
            allSystemPromptData.length > 0 ? encryptionService.decryptBatchSafe(allSystemPromptData) : Promise.resolve([]),
            allNames.length > 0 ? encryptionService.decryptBatchSafe(allNames) : Promise.resolve([])
          ]);

          // Update preferences with decrypted system prompt
          if (preferences && preferencesSystemPromptIndex >= 0 && systemPromptResults[preferencesSystemPromptIndex]) {
            preferences.systemPrompt = systemPromptResults[preferencesSystemPromptIndex].content || '';
          }

          // Second pass: build final chat objects
          for (const chat of paginatedChats) {
            try {
              const chatMessageData = messageMapping.get(chat.id!) || [];
              const decryptedMessages = [];
              
              for (const msgData of chatMessageData) {
                if (msgData.hasEncryption) {
                  const content = messageDecryptResults[msgData.dataIndex]?.content || '[Decryption failed]';
                  decryptedMessages.push({
                    id: msgData.id,
                    role: msgData.role,
                    content,
                    createdAt: msgData.createdAt
                  });
                } else {
                  decryptedMessages.push({
                    id: msgData.id,
                    role: msgData.role,
                    content: '[Message data incomplete]',
                    createdAt: msgData.createdAt
                  });
                }
              }

              // Get system prompt
              const systemIndex = systemPromptMapping.get(chat.id!);
              const systemPrompt = systemIndex !== undefined 
                ? (systemPromptResults[systemIndex]?.content || '') 
                : '';

              // Get decrypted name
              const nameIndex = nameMapping.get(chat.id!);
              const decryptedName = nameIndex !== undefined 
                ? (nameDecryptResults[nameIndex]?.content || 'Unknown Chat')
                : 'Unknown Chat';

              processedChats.push({
                id: chat.id,
                name: decryptedName,
                messages: decryptedMessages,
                model: {
                  id: chat.model_id,
                  name: chat.model_name
                },
                system: systemPrompt,
                folderId: chat.folder_id,
                parentChatId: chat.parent_chat_id,
                branchedAtIndex: chat.branched_at_index,
                source: 'database' as const,
                databaseId: chat.id,
                lastSynced: new Date().toISOString(),
                created_at: chat.created_at,
                updated_at: chat.updated_at
              });
            } catch (error) {
              // console.error(`Failed to process chat ${chat.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to bulk load messages:', error);
        // Fallback to original approach if bulk loading fails
        // (Could add fallback logic here if needed)
      }
    } else {
      // Handle case where there are no chats but preferences may have encrypted system prompt
      if (preferences && preferencesResult.success && preferencesResult.data) {
        const prefs = preferencesResult.data;
        if (prefs.system_prompt_encrypted && prefs.system_prompt_iv && prefs.system_prompt_tag) {
          try {
            const systemPromptResults = await encryptionService.decryptBatchSafe([{
              content_encrypted: prefs.system_prompt_encrypted,
              content_iv: prefs.system_prompt_iv,
              content_tag: prefs.system_prompt_tag
            }]);
            if (systemPromptResults[0]) {
              preferences.systemPrompt = systemPromptResults[0].content || '';
            }
          } catch (error) {
            console.error('Failed to decrypt preferences system prompt:', error);
          }
        }
      }
    }

    const totalChats = chatsResult.success && chatsResult.data ? chatsResult.data.length : 0;
    
    // Find the most recent update timestamp across all data
    const timestamps = [];
    if (preferencesResult.success && preferencesResult.data?.updated_at) {
      timestamps.push(new Date(preferencesResult.data.updated_at));
    }
    if (chatsResult.success && chatsResult.data) {
      chatsResult.data.forEach(chat => {
        if (chat.updated_at) {timestamps.push(new Date(chat.updated_at));}
      });
    }
    if (foldersResult.success && foldersResult.data) {
      foldersResult.data.forEach(folder => {
        if (folder.updated_at) {timestamps.push(new Date(folder.updated_at));}
      });
    }
    
    const lastModified = timestamps.length > 0 
      ? new Date(Math.max(...timestamps.map(t => t.getTime())))
      : new Date();

    const summary = {
      userId: userId.substring(0, 8) + '...',
      hasPreferences: !!preferences,
      chatCount: processedChats.length,
      totalChatCount: totalChats,
      folderCount: folders.length,
      savedPromptsCount: savedPrompts?.length || 0,
      totalMessages: processedChats.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0),
      pagination: {
        limit,
        offset,
        hasMore: totalChats > offset + limit,
        total: totalChats
      },
      loadedAt: new Date().toISOString(),
      lastModified: lastModified.toISOString()
    };

    const responseData = {
      summary,
      preferences,
      chatSessions: processedChats,
      folders,
      savedPrompts: savedPrompts || []
    };

    // Decrypted per-user data: never let the browser reuse it for whoever signs in next
    return new NextResponse(JSON.stringify({
      success: true,
      data: responseData
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  })
);