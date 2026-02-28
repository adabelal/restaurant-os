import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateJWT } from '@/lib/enable-banking';

export async function GET() {
    try {
        const accounts = await prisma.bankAccount.findMany();
        if (accounts.length > 0 && accounts[0].enableBankingSessionId) {
            const token = generateJWT();
            const response = await fetch(`https://api.enablebanking.com/accounts/${accounts[0].accountUid}/balances`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Session-ID': accounts[0].enableBankingSessionId
                }
            });
            const data = await response.json();
            return NextResponse.json({ ok: true, data: data });
        }
        return NextResponse.json({ ok: false, msg: 'No accounts' });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message });
    }
}
