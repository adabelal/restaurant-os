const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("--- PurchaseOrders ---");
        const pos = await prisma.purchaseOrder.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { supplier: true } });
        console.log(JSON.stringify(pos, null, 2));

        console.log("\n--- CashTransactions ---");
        const cash = await prisma.cashTransaction.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
        console.log(JSON.stringify(cash, null, 2));

        console.log("\n--- ProcessedMails ---");
        const mails = await prisma.processedMail.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
        console.log(JSON.stringify(mails, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
