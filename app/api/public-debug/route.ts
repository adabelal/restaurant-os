import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchBalances } from '@/lib/enable-banking';

export async function GET() {
    try {
        const accounts = await prisma.bankAccount.findMany();
        if (accounts.length === 0 || !accounts[0].enableBankingSessionId) {
            return NextResponse.json({ ok: false, msg: 'No active session' });
        }

        const acc = accounts[0];
        const balancesData = await fetchBalances(acc.accountUid, acc.enableBankingSessionId);

        // Find the actual bank balance (usually 'expected' or 'closingBooked')
        let realBalance = 0;
        if (balancesData.balances && balancesData.balances.length > 0) {
            const bal = balancesData.balances.find((b: any) => b.balanceType === 'expected' || b.balanceType === 'closingBooked') || balancesData.balances[0];
            const amObj = bal.balanceAmount || bal.balance_amount;
            const bAmount = amObj.amount || amObj.value;
            realBalance = parseFloat(bAmount);
        }

        const txs = await prisma.bankTransaction.findMany({
            orderBy: { date: 'asc' }
        });

        const calcSum = txs.reduce((sum, tx) => sum + Number(tx.amount), 0);

        // Let's create an adjustment line to fix it.
        const diff = realBalance - calcSum;

        if (Math.abs(diff) > 0.01) {
            // Find existing adjustment
            const existingAdj = await prisma.bankTransaction.findFirst({
                where: { reference: 'INITIAL_BALANCE_ADJUSTMENT' }
            });

            if (existingAdj) {
                // Update it so it perfectly matches
                const newAmount = Number(existingAdj.amount) + diff;
                await prisma.bankTransaction.update({
                    where: { id: existingAdj.id },
                    data: { amount: newAmount }
                });
            } else {
                // Create a new one at the very beginning
                await prisma.bankTransaction.create({
                    data: {
                        date: new Date('2023-01-01T00:00:00Z'),
                        amount: diff,
                        description: 'Ajustement Initial (Solde de départ)',
                        reference: 'INITIAL_BALANCE_ADJUSTMENT',
                        status: 'COMPLETED',
                        transactionType: 'INTERNAL',
                        paymentMethod: 'OTHER',
                        thirdPartyName: 'BANQUE'
                    }
                });
            }
        }

        return NextResponse.json({
            ok: true,
            diffApplied: diff,
            calculatedBefore: calcSum,
            realBalance: realBalance,
            newCalculatedBalance: calcSum + diff
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message, stack: e.stack });
    }
}
