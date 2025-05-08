import { NextResponse } from 'next/server';

import { ACCESS_TOKEN } from '@/app/config/api';

/**
 * API endpoint to check if an access token is required for the application
 * This allows the client to proactively check if token authentication is needed
 */
export async function GET() {
  return NextResponse.json({
    requiresAccessToken: !!ACCESS_TOKEN,
    message: ACCESS_TOKEN 
      ? 'This application requires an access token to continue' 
      : 'No access token required for this application',
  });
} 