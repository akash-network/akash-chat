import { NextResponse } from 'next/server';

import { WS_TRANSCRIPTION_URLS, WS_TRANSCRIPTION_MODEL } from '@/app/config/api';
import { withAuth } from '@/lib/auth';

let currentIndex = 0;
let healthyEndpoints: string[] = [...WS_TRANSCRIPTION_URLS];
const lastCheckResults: Record<string, { healthy: boolean; lastChecked: number }> = {};

const HEALTH_CHECK_EXPIRY = 0.5 * 60 * 1000;

/**
 * Check if a WebSocket endpoint is healthy
 */
async function checkEndpointHealth(url: string): Promise<boolean> {
  try {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const wsHttpUrl = url+"/v1/audio/transcriptions"
      const response = await fetch(wsHttpUrl, { 
        method: 'HEAD',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.status !== 404;
    } catch (error) {
      clearTimeout(timeoutId);
      return false;
    }
  } catch (error) {
    console.error(`Error checking WebSocket endpoint ${url}:`, error);
    return false;
  }
}

/**
 * Update the list of healthy endpoints
 */
async function updateHealthyEndpoints(): Promise<void> {
  const now = Date.now();
  
  // Start with all endpoints
  const allEndpoints = [...WS_TRANSCRIPTION_URLS];
  
  const endpointsToCheck = allEndpoints.filter(url => {
    const lastCheck = lastCheckResults[url];
    return !lastCheck || (now - lastCheck.lastChecked) > HEALTH_CHECK_EXPIRY;
  });
  
  if (endpointsToCheck.length > 0) {
    const checkResults = await Promise.all(
      endpointsToCheck.map(async (url) => {
        const isHealthy = await checkEndpointHealth(url);
        return { url, isHealthy };
      })
    );
    
    checkResults.forEach(({ url, isHealthy }) => {
      lastCheckResults[url] = {
        healthy: isHealthy,
        lastChecked: now
      };
    });
  }
  
  healthyEndpoints = allEndpoints.filter(url => {
    const result = lastCheckResults[url];
    return result && result.healthy;
  });
  
  // If all endpoints are unhealthy, fall back to using all endpoints
  if (healthyEndpoints.length === 0) {
    healthyEndpoints = [...allEndpoints];
  }
  
  // Reset the index if it's out of bounds
  if (currentIndex >= healthyEndpoints.length) {
    currentIndex = 0;
  }
}

/**
 * Get the next healthy WebSocket endpoint in round-robin fashion
 */
function getNextEndpoint(): string {
  if (healthyEndpoints.length === 0) {
    healthyEndpoints = [...WS_TRANSCRIPTION_URLS];
  }
  
  if (healthyEndpoints.length === 0) {
    throw new Error('No WebSocket transcription endpoints configured');
  }
  
  const endpoint = healthyEndpoints[currentIndex];
  
  currentIndex = (currentIndex + 1) % healthyEndpoints.length;
  
  return endpoint;
}

/**
 * API route handler to get the next healthy WebSocket endpoint
 */
async function handleGetRequest() {
  await updateHealthyEndpoints();
  
  const endpoint = getNextEndpoint();
  
  return NextResponse.json({
    url: endpoint,
    healthyEndpoints: healthyEndpoints.length,
    totalEndpoints: WS_TRANSCRIPTION_URLS.length,
    model: WS_TRANSCRIPTION_MODEL,
  });
}

export const GET = withAuth(handleGetRequest); 