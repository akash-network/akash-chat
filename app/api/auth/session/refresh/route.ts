import crypto from 'crypto';

import { NextResponse } from 'next/server';

import { CACHE_TTL } from '@/app/config/api';
import { checkApiAccessToken } from '@/lib/auth';
import { validateSession, storeSession } from '@/lib/redis';
import redis from '@/lib/redis';

const RATE_LIMIT_WINDOW = Math.floor(CACHE_TTL * 0.20 * 0.25);
const MAX_REQUESTS = 3;

async function isRateLimited(token: string): Promise<boolean> {
    const key = `ratelimit:refresh:${token}`;
    const now = Math.floor(Date.now() / 1000);

    try {
        await redis.zadd(key, now, now.toString());

        await redis.zremrangebyscore(key, 0, now - RATE_LIMIT_WINDOW);

        const requestCount = await redis.zcard(key);

        await redis.expire(key, RATE_LIMIT_WINDOW);

        return requestCount > MAX_REQUESTS;
    } catch (error) {
        console.error('Rate limit check failed:', error);
        return false;
    }
}

export async function POST(request: Request) {
    try {
        if (process.env.NODE_ENV === 'production') {
            const userAgent = request.headers.get('user-agent');
            const secFetchSite = request.headers.get('sec-fetch-site');
            const secFetchMode = request.headers.get('sec-fetch-mode');

            if (!userAgent ||
                (secFetchSite && !['same-origin', 'same-site', 'none'].includes(secFetchSite)) ||
                (secFetchMode && !['navigate', 'cors', 'no-cors'].includes(secFetchMode))) {
                return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
            }
        }

        const cookieHeader = request.headers.get('cookie');
        const currentToken = cookieHeader?.split(';')
            .find(c => c.trim().startsWith('session_token='))
            ?.split('=')[1];

        if (!currentToken) {
            return NextResponse.json({ error: 'No session token found' }, { status: 401 });
        }

        const authCheckResponse = checkApiAccessToken(request);
        if (authCheckResponse) {
            return authCheckResponse;
        }

        if (await isRateLimited(currentToken)) {
            return NextResponse.json(
                { error: 'Too many refresh attempts. Please try again later.' },
                { status: 429 }
            );
        }
        const ttl = await redis.ttl(`session:${currentToken}`);
        const isValid = await validateSession(currentToken);

        if (isValid && ttl > CACHE_TTL * 0.20) {
            return NextResponse.json({ success: true });
        }
        const newToken = crypto.randomBytes(32).toString('hex');
        await storeSession(newToken);

        const response = NextResponse.json({ success: true });

        response.cookies.set('session_token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: CACHE_TTL,
            path: '/',
            partitioned: process.env.NODE_ENV === 'production',
        });

        return response;
    } catch (error) {
        console.error('Session refresh error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}