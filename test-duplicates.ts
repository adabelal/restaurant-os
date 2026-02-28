import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function run() {
    const txs = await prisma.bankTransaction.findMany({ orderBy: { date: 'asc' } })
    console.log(`Total Tx: ${txs.length}`);
    const sum = txs.reduce((s, t) => s + Number(t.amount), 0)
    console.log(`Current Balance: ${sum}`);
}
run();
