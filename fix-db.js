const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Resetting cash categories to null to fix foreign key constraint...");
        await prisma.$executeRawUnsafe(`UPDATE "CashTransaction" SET "categoryId" = NULL;`);
        console.log("Done.");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
