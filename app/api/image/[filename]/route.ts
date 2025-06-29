import { NextRequest, NextResponse } from 'next/server';

import { imgEndpoint, imgApiKey } from '@/app/config/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    if (!imgEndpoint || !imgApiKey) {
      return NextResponse.json({ error: 'Image service not configured' }, { status: 500 });
    }

    // Fetch image from private middleware
    const imageUrl = `${imgEndpoint}/upload/${filename}`;
    const response = await fetch(imageUrl, {
      headers: {
        'Authorization': `Bearer ${imgApiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }

    // Get the image data and content type
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}