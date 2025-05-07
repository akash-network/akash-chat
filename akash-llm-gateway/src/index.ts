import express from 'express';
import dotenv from 'dotenv';
import { setupRoutes } from './routes';
import { logger } from './utils/logger';
import { EndpointManager } from './services/endpointManager';
import { ProviderSelector } from './services/providerSelector';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Initialize services
  const endpointManager = new EndpointManager();
  await endpointManager.initialize();
  
  const providerSelector = new ProviderSelector(endpointManager);
  await providerSelector.initialize();

  // Add to app context
  app.set('endpointManager', endpointManager);
  app.set('providerSelector', providerSelector);

  // Setup routes
  setupRoutes(app);

  app.listen(PORT, () => {
    logger.info(`LLM Proxy Server running on port ${PORT}`);
  });
}

startServer().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
}); 