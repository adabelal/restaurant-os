import { fetchTransactions, generateJWT } from './lib/enable-banking';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function run() {
    const accs = await prisma.bankAccount.findMany();
    if (accs.length > 0 && accs[0].enableBankingSessionId) {
        const token = generateJWT();
        const response = await fetch(`https://api.enablebanking.com/accounts/${accs[0].accountUid}/balances`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Session-ID': accs[0].enableBankingSessionId
            }
        });
        const balances = await response.json();
        console.log(JSON.stringify(balances, null, 2));
    }
}
run();
