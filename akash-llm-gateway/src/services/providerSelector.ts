import { LLMProvider } from './providers/LLM';
import { logger } from '../utils/logger';
import { Provider } from '../types';
import { EndpointManager } from './endpointManager';

export class ProviderSelector {
  private providers: Record<string, Provider> = {};

  constructor(private endpointManager: EndpointManager) {}

  public async initialize(): Promise<void> {
    await this.initializeProviders();
  }

  private async initializeProviders() {
    const models = await this.endpointManager.getAvailableModels();
    const llmProvider = new LLMProvider(this.endpointManager);

    models.data.forEach(model => {
      this.providers[model.id] = llmProvider;
      logger.info(`Registered provider for model: ${model.id}`);
    });
  }

  getProvider(model: string): Provider {
    const provider = this.providers[model];
    
    if (!provider) {
      logger.error(`No provider found for model: ${model}`);
      throw new Error(`Unsupported model: ${model}`);
    }
    
    return provider;
  }
} 