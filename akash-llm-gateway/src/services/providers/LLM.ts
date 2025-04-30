import axios, { AxiosResponse } from 'axios';
import { logger } from '../../utils/logger';
import { Provider, ChatCompletionRequest } from '../../types';
import { EndpointConfig } from '../../types/endpoint';
import { EndpointManager } from '../endpointManager';

export class LLMProvider implements Provider {
  private endpointWeights: Map<string, number[]> = new Map();

  constructor(private endpointManager: EndpointManager) {}

  private initializeWeights(modelId: string, endpoints: EndpointConfig[]): void {
    if (!this.endpointWeights.has(modelId)) {
      // Create cumulative weights array for weighted selection
      const weights: number[] = [];
      let sum = 0;
      
      endpoints.forEach((endpoint, index) => {
        // Default weight to 1 if not specified
        const weight = endpoint.weight || 1;
        sum += weight;
        weights[index] = sum;
      });
      
      this.endpointWeights.set(modelId, weights);
    }
  }

  private getNextEndpoint(modelId: string, endpoints: EndpointConfig[]): EndpointConfig {
    this.initializeWeights(modelId, endpoints);
    const weights = this.endpointWeights.get(modelId)!;
    const totalWeight = weights[weights.length - 1];
    
    // Generate random number between 0 and total weight
    const random = Math.random() * totalWeight;
    
    // Find the first weight that is greater than the random number
    const selectedIndex = weights.findIndex(weight => random <= weight);
    
    logger.debug(`Selected endpoint ${selectedIndex} for model ${modelId} (random: ${random}, total weight: ${totalWeight})`);
    return endpoints[selectedIndex];
  }

  async createChatCompletion(payload: ChatCompletionRequest, res?: any): Promise<any> {
    const endpoints = this.endpointManager.getEndpointsForModel(payload.model);
    
    if (!endpoints.length) {
      throw new Error(`No endpoints available for model: ${payload.model}`);
    }

    const endpoint = this.getNextEndpoint(payload.model, endpoints);

    try {
      if (payload.stream && res) {
        const response = await axios({
          method: 'post',
          url: `${endpoint.url}/v1/chat/completions`,
          data: payload,
          headers: {
            'Authorization': `Bearer ${endpoint.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          responseType: 'stream'
        });

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Pipe the stream directly to the response
        response.data.pipe(res);
        
        return new Promise((resolve, reject) => {
          response.data.on('end', resolve);
          response.data.on('error', reject);
        });
      } else {
        // Non-streaming request
        const response: AxiosResponse = await axios.post(
          `${endpoint.url}/v1/chat/completions`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${endpoint.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        return response.data;
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`API error: ${error.message}`);
      }
      throw error;
    }
  }
} 