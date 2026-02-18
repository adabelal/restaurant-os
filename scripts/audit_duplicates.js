
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function audit() {
    console.log("🔍 Audit des transactions (Mode JS Pur)...");

    // 1. Audit Banque
    try {
        const bankTx = await prisma.bankTransaction.findMany();
        console.log(`📊 Total Bank Transactions: ${bankTx.length}`);

        const bankDuplicates = new Map();
        let bankDupCount = 0;

        for (const tx of bankTx) {
            const key = `${tx.date.toISOString().split('T')[0]}_${tx.amount}_${tx.description.trim()}`;
            if (bankDuplicates.has(key)) {
                bankDuplicates.get(key).push(tx.id);
                bankDupCount++;
            } else {
                bankDuplicates.set(key, [tx.id]);
            }
        }
        console.log(`⚠️ Potential Bank Duplicates: ${bankDupCount}`);

        if (bankDupCount > 0) {
            console.log("   -> Exemple: ", Array.from(bankDuplicates.entries()).find(([k, v]) => v.length > 1));
        }

    } catch (e) {
        console.error("Erreur lecture Banque:", e);
    }

    // 2. Audit Caisse
    try {
        const cashTx = await prisma.cashTransaction.findMany();
        console.log(`📊 Total Cash Transactions: ${cashTx.length}`);

        // Pour la caisse, c'est souvent l'import excel complet qui a été dupliqué
        // On va vérifier si on a beaucoup de transactions le même jour avec le même montant
        const cashDuplicates = new Map();
        let cashDupCount = 0;

        for (const tx of cashTx) {
            const key = `${tx.date.toISOString().split('T')[0]}_${tx.amount}_${tx.type}`;
            if (cashDuplicates.has(key)) {
                cashDuplicates.get(key).push(tx.id);
                cashDupCount++;
            } else {
                cashDuplicates.set(key, [tx.id]);
            }
        }
        console.log(`⚠️ Potential Cash Duplicates: ${cashDupCount}`);

    } catch (e) {
        console.error("Erreur lecture Caisse:", e);
    }
}

audit()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
