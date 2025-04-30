import { NextResponse } from 'next/server';
import { getAvailableModels } from '@/lib/models';
import { withAuth } from '@/lib/auth';

async function handleGetRequest() {
    const models = await getAvailableModels();
    return NextResponse.json(models);
}

export const GET = withAuth(handleGetRequest); 