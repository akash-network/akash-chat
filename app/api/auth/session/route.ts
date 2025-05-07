import crypto from 'crypto';

import { NextResponse } from 'next/server';

import { CACHE_TTL } from '@/app/config/api';
import { checkApiAccessToken } from '@/lib/auth';
import { storeSession } from '@/lib/redis';

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    const userAgent = request.headers.get('user-agent');
    const secFetchSite = request.headers.get('sec-fetch-site');
    const secFetchMode = request.headers.get('sec-fetch-mode');

    // Simplified checks
    if (!userAgent) {
      return NextResponse.json({ error: 'Invalid request - no user agent' }, { status: 403 });
    }

    // Sec-Fetch headers might not be present in all browsers/requests
    // Only check if they're present and be more permissive with allowed values
    if (secFetchSite && !['same-origin', 'same-site', 'none'].includes(secFetchSite)) {
      return NextResponse.json({ error: 'Invalid request - invalid fetch site' }, { status: 403 });
    }

    if (secFetchMode && !['navigate', 'cors', 'no-cors'].includes(secFetchMode)) {
      return NextResponse.json({ error: 'Invalid request - invalid fetch mode' }, { status: 403 });
    }
  }
  
  const authCheckResponse = checkApiAccessToken(request);
  if (authCheckResponse) {
    return authCheckResponse;
  }

  const sessionToken = crypto.randomBytes(32).toString('hex');

  await storeSession(sessionToken);

  const response = NextResponse.json({ success: true });

  response.cookies.set('session_token', sessionToken, {
    httpOnly: process.env.NODE_ENV === 'production',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CACHE_TTL,
    path: '/',
    partitioned: process.env.NODE_ENV === 'production',
  });

  return response;
}