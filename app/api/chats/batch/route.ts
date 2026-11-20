import { NextRequest } from 'next/server';

import { requireAuth } from '@/lib/middleware/auth';
import { withErrorHandling, createSuccessResponse, validateRequestBody, ValidationError } from '@/lib/middleware/error-handler';
import { createDatabaseService } from '@/lib/services/database-service';
import { createEncryptionService } from '@/lib/services/encryption-service';

// Each message is a separate encrypt + insert, so bound the work a single request can queue
const MAX_CHATS_PER_BATCH = 50;
const MAX_MESSAGES_PER_BATCH = 2000;

export const POST = withErrorHandling(
  requireAuth(async (request: NextRequest, userId: string, _user: any) => {
    // Validate request body
    const { chats } = await validateRequestBody(request, ['chats']);

    if (!Array.isArray(chats)) {
      throw new ValidationError('Chats must be an array');
    }

    if (chats.length > MAX_CHATS_PER_BATCH) {
      throw new ValidationError(`At most ${MAX_CHATS_PER_BATCH} chats can be saved per request`);
    }

    const messageCount = chats.reduce((sum, chat) => sum + (Array.isArray(chat?.messages) ? chat.messages.length : 0), 0);
    if (messageCount > MAX_MESSAGES_PER_BATCH) {
      throw new ValidationError(`At most ${MAX_MESSAGES_PER_BATCH} messages can be saved per request`);
    }

    if (chats.length === 0) {
      return createSuccessResponse({ chatsSaved: 0, totalChats: 0, messagesSaved: 0 });
    }

    // Create services
    const dbService = createDatabaseService(userId);
    const encryptionService = createEncryptionService(userId);

    let totalMessages = 0;
    let savedChats = 0;
    const errors: string[] = [];

    // Process each chat
    for (const chat of chats) {
      try {
        // Skip private chats - they should never be saved to database
        if (chat.isPrivate) {
          continue;
        }

        // Validate required chat fields
        if (!chat.id || !chat.name || !chat.model) {
          errors.push(`Chat missing required fields: ${chat.id || 'unknown'}`);
          continue;
        }

        // Prepare chat session data
        const chatSession: any = {
          id: chat.id,
          name: chat.name,
          model_id: chat.model?.id || chat.model_id,
          model_name: chat.model?.name || chat.model_name,
          folder_id: chat.folderId,
          parent_chat_id: chat.parentChatId,
          branched_at_index: chat.branchedAtIndex,
          created_at: chat.created_at,
          updated_at: chat.updated_at
        };

        // Handle system prompt encryption if present
        if (chat.system) {
          const encryptedPrompt = await encryptionService.encryptForDatabase(chat.system);
          chatSession.system_prompt_encrypted = encryptedPrompt.content_encrypted;
          chatSession.system_prompt_iv = encryptedPrompt.content_iv;
          chatSession.system_prompt_tag = encryptedPrompt.content_tag;
        }

        // Save chat session using database service
        const chatResult = await dbService.saveChatSession(chatSession);
        if (!chatResult.success) {
          errors.push(`Failed to save chat ${chat.id}: ${chatResult.error}`);
          continue;
        }

        // Save messages for this chat
        if (chat.messages && Array.isArray(chat.messages) && chat.messages.length > 0) {
          let messagesSaved = 0;
          
          for (let i = 0; i < chat.messages.length; i++) {
            const message = chat.messages[i];
            
            if (!message.role || !['user', 'assistant', 'system'].includes(message.role)) {
              errors.push(`Invalid message role in chat ${chat.id} at position ${i}`);
              continue;
            }

            // Skip empty messages - they should never be saved to database
            const isEmpty = !message.content || message.content.trim() === '';
            if (isEmpty) {
              continue;
            }

            const messageResult = await dbService.saveChatMessage(
              chat.id,
              message.role,
              message.content,
              i,
              message.tokenCount,
            );

            if (messageResult.success) {
              messagesSaved++;
            } else {
              errors.push(`Failed to save message ${i} in chat ${chat.id}: ${messageResult.error}`);
            }
          }
          
          totalMessages += messagesSaved;
        }

        savedChats++;
        
      } catch (error) {
        const errorMsg = `Failed to process chat ${chat.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
      }
    }

    return createSuccessResponse({
      chatsSaved: savedChats,
      totalChats: chats.length,
      messagesSaved: totalMessages,
      errors: errors.length > 0 ? errors : undefined
    });
  })
); 