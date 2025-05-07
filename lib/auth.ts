import * as crypto from 'crypto';

import { NextRequest, NextResponse } from 'next/server';

import { ACCESS_TOKEN } from '@/app/config/api';

import { validateSession } from './redis';

const HASHED_ACCESS_TOKEN = ACCESS_TOKEN ? 
  crypto.createHash('sha256').update(ACCESS_TOKEN).digest('hex') : null;

export async function validateSessionToken(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  const sessionToken = cookieHeader?.split(';')
      .find(c => c.trim().startsWith('session_token='))
      ?.split('=')[1];

  if (!sessionToken) {return false;}
  
  try {
    return await validateSession(sessionToken);
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

export function withAuth(handler: Function) {
  return async function(req: NextRequest) {
    const isValid = await validateSessionToken(req);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Unauthorized: Invalid session'
        }),
        {
          status: 403,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }
    
    return handler(req);
  }
}

/**
 * Creates a constant-time comparison of two strings to prevent timing attacks
 * @param a First string
 * @param b Second string
 * @returns True if the strings are equal
 */
function secureCompare(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) {
    return false;
  }

  // Manual constant-time comparison as a fallback
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Middleware function to check API access token
 * @param request - The incoming request
 * @returns Response object if authentication fails, null if authentication passes
 */
export function checkApiAccessToken(request: Request): NextResponse | null {
  // If no access token is required, always pass authentication
  if (!HASHED_ACCESS_TOKEN) {
    return null;
  }
  
  const authHeader = request.headers.get('Authorization');
  const accessToken = authHeader?.split(' ')[1];
  
  // If access token is required but not provided
  if (!accessToken) {
    return NextResponse.json({ 
      error: 'Access token required',
      message: 'This application requires an access token to continue'
    }, { status: 403 });
  }

  // If access token is provided but doesn't match
  if (!secureCompare(accessToken, HASHED_ACCESS_TOKEN)) {
    return NextResponse.json({ 
      error: 'Invalid Access token',
      message: 'The provided access token is invalid' 
    }, { status: 403 });
  }
  
  // Authentication successful
  return null;
} 