import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ChatCompletionRequest } from '../types';

export async function handleChatCompletion(req: Request, res: Response): Promise<void> {
  try {
    const payload = req.body as ChatCompletionRequest;
    
    if (!payload.model) {
      res.status(400).json({ error: 'Model parameter is required' });
      return;
    }

    const providerSelector = req.app.get('providerSelector');
    const provider = providerSelector.getProvider(payload.model);

    if (payload.stream) {
      // Handle streaming response
      await provider.createChatCompletion(payload, res);
    } else {
      // Handle regular response
      const response = await provider.createChatCompletion(payload);
      res.json(response);
    }
  } catch (error) {
    logger.error('Error in chat completion:', error);
    // A stream that fails after headers were sent can't switch to a JSON error; writing one throws and,
    // as an unhandled rejection, takes down the whole process
    if (res.headersSent) {
      res.end();
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
} 