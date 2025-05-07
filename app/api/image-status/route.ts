import { imgApiKey, imgEndpoint } from '@/app/config/api';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return Response.json({ error: 'No job IDs provided' }, { status: 400 });
    }

    // Forward the request to check status
    const response = await fetch(`${imgEndpoint}/status?ids=${ids}`, {
      headers: {
        'Authorization': `Bearer ${imgApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error checking image status:', error);
    return Response.json({ error: 'Failed to check image status' }, { status: 500 });
  }
} 