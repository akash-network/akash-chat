import { NextResponse } from 'next/server';

import { apiEndpoint, apiKey, imgEndpoint, imgApiKey } from '@/app/config/api';
import { models } from '@/app/config/models';

async function checkApiEndpoint(url: string, apiKey: string | undefined) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a WebSocket endpoint is healthy
 */
async function checkWebSocketEndpoint(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const wsHttpUrl = url + "/v1/audio/transcriptions";
      const response = await fetch(wsHttpUrl, { 
        method: 'POST',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.status === 422;
    } catch (error) {
      clearTimeout(timeoutId);
      return false;
    }
  } catch (error) {
    console.error(`Error checking WebSocket endpoint ${url}:`, error);
    return false;
  }
}

export async function GET() {
  const baseApiEndpoint = apiEndpoint.replace('/v1', '');
  const websocketUrls = process.env.WS_TRANSCRIPTION_URLS?.split(',') || [];
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      chat_api: {
        status: false,
        configured: !!apiKey
      },
      image_api: {
        status: false,
        configured: !!imgApiKey
      },
      models: {
        available: models.filter(m => m.available).length,
        total: models.length,
        status: models.some(m => m.available)
      },
      speech_to_text: {
        status: false,
        configured: websocketUrls.length > 0,
        servers: websocketUrls.length,
        endpoints: [] as { url: string; status: boolean }[]
      }
    }
  };

  // Check chat API
  health.services.chat_api.status = await checkApiEndpoint(`${baseApiEndpoint}/health/readiness`, apiKey);

  // Check image API if configured
  if (imgEndpoint) {
    health.services.image_api.status = await checkApiEndpoint(`${imgEndpoint}/get-workers`, imgApiKey);
  }

  // Check websocket servers if configured
  if (websocketUrls.length > 0) {
    const wsChecks = await Promise.all(websocketUrls.map(async (url) => {
      const status = await checkWebSocketEndpoint(url);
      return { url, status };
    }));
    
    health.services.speech_to_text.endpoints = wsChecks.map(check => ({
      url: check.url,
      status: check.status
    }));
    
    // Overall speech-to-text status is true if at least one endpoint is healthy
    health.services.speech_to_text.status = wsChecks.some(check => check.status);
  }

  // Overall status is healthy only if all critical services are up
  if (!health.services.chat_api.status || 
      (imgEndpoint && !health.services.image_api.status) || 
      !health.services.models.status ||
      (websocketUrls.length > 0 && !health.services.speech_to_text.status)) {
    health.status = 'unhealthy';
  }

  return NextResponse.json(health, { status: health.status === 'healthy' ? 200 : 500 });
} 