
import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/enable-banking';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const baseUrl = process.env.NEXTAUTH_URL || 'https://app.siwa-bleury.fr';

    if (!code) {
        return NextResponse.redirect(new URL('/finance?error=missing_code', baseUrl));
    }

    try {
        const session = await createSession(code);

        // session contains: { session_id, accounts: [{ uid, aspsp: { name }, name, currency }] }
        if (session.accounts && session.accounts.length > 0) {
            for (const acc of session.accounts) {
                await prisma.bankAccount.upsert({
                    where: { accountUid: acc.uid },
                    update: {
                        aspspName: acc.aspsp.name,
                        accountName: acc.name,
                        currency: acc.currency,
                        enableBankingSessionId: session.session_id
                    },
                    create: {
                        accountUid: acc.uid,
                        aspspName: acc.aspsp.name,
                        accountName: acc.name,
                        currency: acc.currency,
                        enableBankingSessionId: session.session_id
                    },
                });
            }
        }

        // Redirect with success message
        return NextResponse.redirect(new URL('/finance?sync=success', baseUrl));

    } catch (error: any) {
        console.error('Bank Callback Error:', error);
        return NextResponse.redirect(new URL(`/finance?error=session_failed&details=${encodeURIComponent(error.message)}`, baseUrl));
    }
}
