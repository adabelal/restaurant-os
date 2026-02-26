
import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/enable-banking';
import { requireAuth } from '@/lib/auth-utils';

export async function GET() {
    try {
        await requireAuth();

        const url = await getAuthUrl();
        return NextResponse.json({ url });
    } catch (error: any) {
        console.error('Bank Connect Init Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
