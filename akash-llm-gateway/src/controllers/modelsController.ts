import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export async function handleGetModels(req: Request, res: Response): Promise<void> {
  try {
    const endpointManager = req.app.get('endpointManager');
    const models = await endpointManager.getAvailableModels();
    res.json(models);
  } catch (error) {
    logger.error('Error fetching models:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 