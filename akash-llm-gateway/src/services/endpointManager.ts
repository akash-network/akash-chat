import axios from 'axios';
import { EndpointConfig, ModelsResponse } from '../types/endpoint';
import { logger } from '../utils/logger';

export class EndpointManager {
  private endpoints: EndpointConfig[] = [];
  private modelMap: Map<string, EndpointConfig[]> = new Map();

  constructor() {}

  async initialize(): Promise<void> {
    await this.loadEndpoints();
  }

  private async loadEndpoints() {
    const endpointConfigs = process.env.ENDPOINTS;
    if (!endpointConfigs) {
      throw new Error('No endpoints configured');
    }

    try {
      this.endpoints = JSON.parse(endpointConfigs);
      await this.discoverModels();
    } catch (error) {
      logger.error('Failed to parse endpoint configurations:', error);
      throw error;
    }
  }

  private async discoverModels() {
    for (const endpoint of this.endpoints) {
      try {
        const response = await axios.get<ModelsResponse>(`${endpoint.url}/v1/models`, {
          headers: {
            'Authorization': `Bearer ${endpoint.apiKey}`
          }
        });

        response.data.data.forEach(model => {
          const existingEndpoints = this.modelMap.get(model.id) || [];
          this.modelMap.set(model.id, [...existingEndpoints, endpoint]);
          logger.info(`Discovered model ${model.id} from endpoint ${endpoint.url}`);
        });

      } catch (error) {
        logger.error(`Failed to discover models for endpoint ${endpoint.url}:`, error);
      }
    }
  }

  public getEndpointsForModel(modelId: string): EndpointConfig[] {
    return this.modelMap.get(modelId) || [];
  }

  public async getAvailableModels(): Promise<ModelsResponse> {
    const uniqueModels = new Map();
    
    this.modelMap.forEach((endpoints, modelId) => {
      uniqueModels.set(modelId, {
        id: modelId,
        object: 'model',
        created: Date.now(),
        owned_by: 'proxy'
      });
    });

    return {
      data: Array.from(uniqueModels.values())
    };
  }
} 