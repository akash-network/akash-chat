import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth';
import { getAvailableModels } from '@/lib/models';

async function handleGetRequest() {
    const models = await getAvailableModels();
    return NextResponse.json(models);
}

export const GET = withAuth(handleGetRequest); 