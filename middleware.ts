import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  const nonce = btoa(crypto.randomUUID());

  const csp = [
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://chat.akash.network https://www.google-analytics.com https://avatars.githubusercontent.com https://*.googleusercontent.com https://*.gravatar.com`,
    `font-src 'self'`,
    `connect-src 'self' https://api.akashml.com https://chatapi.akash.network https://auth.akash.network https://*.auth0.com https://www.google-analytics.com https://www.googletagmanager.com wss:`,
    `worker-src 'self'`,
    `media-src 'self' blob:`,
    `frame-src 'none'`,
    `frame-ancestors 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `manifest-src 'self'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api/auth|_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|otf|mp3|mp4|webm)).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
