import { imgApiKey, imgEndpoint } from '@/app/config/api';

// Disable caching for this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return Response.json({ error: 'No job IDs provided' }, { status: 400 });
    }

    // Forward the request to check status with cache-busting
    const response = await fetch(`${imgEndpoint}/status?ids=${ids}&_t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${imgApiKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      console.error(`Middleware status check failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Middleware error response:', errorText);
      return Response.json({ error: `Middleware error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    
    // Convert middleware image paths to proxy URLs
    if (Array.isArray(data)) {
      const updatedData = data.map(job => {
        if (job.status === 'succeeded' && job.result) {
          // Extract filename from the full URL
          const filename = job.result.split('/').pop();
          return {
            ...job,
            result: `/api/image/${filename}`
          };
        }
        return job;
      });
      return new Response(JSON.stringify(updatedData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error checking image status:', error);
    return Response.json({ error: 'Failed to check image status' }, { status: 500 });
  }
} 