const { PrismaClient } = require('@prisma/client');
const { fetchTransactions } = require('./lib/enable-banking.js');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    const accs = await prisma.bankAccount.findMany();
    if(accs.length > 0) {
        console.log("Account", accs[0].accountUid);
        if(accs[0].enableBankingSessionId) {
            try {
               const data = await fetchTransactions(accs[0].accountUid, accs[0].enableBankingSessionId);
               fs.writeFileSync('eb-data.json', JSON.stringify(data, null, 2));
               console.log("Wrote eb-data.json");
            } catch (e) {
               console.error("fetch err", e);
            }
        }
    }
}
main();
