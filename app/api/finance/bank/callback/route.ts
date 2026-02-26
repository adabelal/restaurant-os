
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

        if (session.accounts && session.accounts.length > 0) {
            for (const acc of session.accounts) {
                // S'assurer de récupérer l'UID même si l'API retourne un format différent
                const uid = acc.uid || acc.account_id?.iban || acc.id || String(acc);
                const aspspName = acc.aspsp?.name || session.aspsp?.name || 'Banque Connectée';
                const accountName = acc.name || `Compte ${uid.substring(uid.length - 4)}`;
                const currency = acc.currency || 'EUR';

                await prisma.bankAccount.upsert({
                    where: { accountUid: uid },
                    update: {
                        aspspName: aspspName,
                        accountName: accountName,
                        currency: currency,
                        enableBankingSessionId: session.session_id
                    },
                    create: {
                        accountUid: uid,
                        aspspName: aspspName,
                        accountName: accountName,
                        currency: currency,
                        enableBankingSessionId: session.session_id
                    },
                });
            }
        }

        // Redirect to the new dedicated bank page
        return NextResponse.redirect(new URL('/finance/bank?sync=success', baseUrl));

    } catch (error: any) {
        console.error('Bank Callback Error:', error);
        return NextResponse.redirect(new URL(`/finance/bank?error=session_failed&details=${encodeURIComponent(error.message)}`, baseUrl));
    }
}
