import Redis from 'ioredis';

import { CACHE_TTL } from '@/app/config/api';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface SessionData {
  created: number;
  lastAccessed: number;
}

// Session management functions
export async function storeSession(
  sessionToken: string, 
  expiryInSeconds: number = CACHE_TTL
) {
  const sessionData: SessionData = {
    created: Date.now(),
    lastAccessed: Date.now()
  };

  await redis.set(
    `session:${sessionToken}`, 
    JSON.stringify(sessionData), 
    'EX', 
    expiryInSeconds
  );
}

export async function validateSession(sessionToken: string): Promise<boolean> {
  // Check if token has valid format (64 character hex string)
  if (!/^[a-f0-9]{64}$/.test(sessionToken)) {
    return false;
  }

  try {
    const sessionData = await redis.get(`session:${sessionToken}`);
    if (!sessionData) {return false;}

    // Parse and validate session data
    const data = JSON.parse(sessionData) as SessionData;
    const now = Date.now();
    
    // Update last accessed time
    await redis.set(
      `session:${sessionToken}`,
      JSON.stringify({ ...data, lastAccessed: now }),
      'KEEPTTL' // Keep the existing TTL
    );

    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

export async function deleteSession(sessionToken: string) {
  await redis.del(`session:${sessionToken}`);
}

export default redis; 