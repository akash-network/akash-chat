import { NextRequest } from 'next/server';

import { requireAuth } from '@/lib/middleware/auth';
import { withErrorHandling, createSuccessResponse, validateRequestBody, ValidationError } from '@/lib/middleware/error-handler';
import { createDatabaseService } from '@/lib/services/database-service';

const MAX_FOLDERS_PER_BATCH = 100;

export const POST = withErrorHandling(
  requireAuth(async (request: NextRequest, userId: string, _user: any) => {
    // Validate request body
    const { folders } = await validateRequestBody(request, ['folders']);

    if (!Array.isArray(folders)) {
      throw new ValidationError('Folders must be an array');
    }

    if (folders.length > MAX_FOLDERS_PER_BATCH) {
      throw new ValidationError(`At most ${MAX_FOLDERS_PER_BATCH} folders can be saved per request`);
    }

    if (folders.length === 0) {
      return createSuccessResponse({ count: 0, folders: [] });
    }

    // Validate folder data
    const validFolders = folders.filter(folder => {
      if (!folder || typeof folder !== 'object') {
        return false;
      }
      if (!folder.name || typeof folder.name !== 'string') {
        return false;
      }
      return true;
    });

    if (validFolders.length === 0) {
      throw new ValidationError('No valid folders provided');
    }

    // Create database service
    const dbService = createDatabaseService(userId);

    // Save folders using batch operation
    const result = await dbService.saveFoldersBatch(validFolders);

    return createSuccessResponse({
      count: result.results.length,
      totalProcessed: result.totalProcessed,
      totalFailed: result.totalFailed,
      folders: result.results,
      errors: result.errors.length > 0 ? result.errors : undefined
    });
  })
);