import OpenAI from 'openai';

import { apiEndpoint, apiKey } from '@/app/config/api';
import { models, Model } from '@/app/config/models';
import redis from '@/lib/redis';

const MODELS_CACHE_KEY = 'cached_models';
const MODELS_CACHE_TTL = 600; // Cache for 10 minutes

export async function getAvailableModels(): Promise<Model[]> {
    try {
        const cachedModels = await redis.get(MODELS_CACHE_KEY);
        if (cachedModels) {
            return JSON.parse(cachedModels);
        }

        const response = await fetch(apiEndpoint + '/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        const apiModels = await response.json();
        const isProxy = apiModels.data.some((apiModel: OpenAI.Model) => apiModel.owned_by === 'proxy')
        const isChatApi = apiEndpoint.includes('chatapi.akash.network');
        const availableModels = models.filter(model => 
            // If model has explicit available: true, include it
            model.available === true || 
            // Otherwise check if it's in the API
            apiModels.data.some((apiModel: OpenAI.Model) => apiModel.id === model.id)
        );

        // Get additional models from the API, with pre-defined parameters
        const additionalModels = apiModels.data
            .filter((apiModel: OpenAI.Model) => 
                !models.some(model => model.id === apiModel.id) && (apiModel.owned_by === 'proxy' || isChatApi))
            .map((apiModel: OpenAI.Model) => ({
                id: apiModel.id,
                name: apiModel.id.split('/').pop() || apiModel.id,
                description: `${apiModel.id} model`,
                temperature: 0.7,
                top_p: 0.95,
                available: true,
                owned_by: apiModel.owned_by
            }));
        const explicitlyAvailableModels = models.filter(model => model.available === true);
        
        // Combine all models and add AkashGen
        const allModels = [
            ...(!isProxy && !isChatApi ? availableModels : explicitlyAvailableModels), 
            ...additionalModels,
            ...(!isProxy && !isChatApi && models.find(model => model.id === 'AkashGen') ? [models.find(model => model.id === 'AkashGen')] : [])
        ].filter(Boolean).map(model => ({
            ...model,
            available: true  // Ensure all returned models have available: true
        })) as Model[];
        await redis.setex(MODELS_CACHE_KEY, MODELS_CACHE_TTL, JSON.stringify(allModels));

        return allModels;
    } catch (error) {
        console.error('Error fetching models:', error);
        // Return predefined models as fallback
        return models;
    }
} 