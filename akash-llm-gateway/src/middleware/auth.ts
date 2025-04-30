import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const proxyApiKey = process.env.PROXY_API_KEY;

  if (!proxyApiKey) {
    logger.error('PROXY_API_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is required' });
  }

  const token = authHeader.split(' ')[1]; 
  
  if (token !== proxyApiKey) {
    logger.warn(`Invalid API key attempt: ${token.substring(0, 8)}...`);
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
} 