import { Express } from 'express';
import { handleChatCompletion } from './controllers/chatController';
import { handleGetModels } from './controllers/modelsController';
import { authMiddleware } from './middleware/auth';

export function setupRoutes(app: Express): void {
  // Apply auth middleware
  app.use('/v1', authMiddleware);

  // Models endpoint
  app.get('/v1/models', handleGetModels);
  
  // Chat completions endpoint
  app.post('/v1/chat/completions', handleChatCompletion);
} 