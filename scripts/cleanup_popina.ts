
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
    console.log("🚀 Starting cleanup of Caisse data created today...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        // 1. Compter les transactions Popina à supprimer
        // On cible spécifiquement celles créées aujourd'hui avec "Popina" dans la description
        // ou simplement tout ce qui a été créé aujourd'hui si l'utilisateur est sûr.
        // Pour être sûr, on filtre sur la description qui contient "Popina"
        const count = await prisma.cashTransaction.count({
            where: {
                createdAt: {
                    gte: today
                },
                description: {
                    contains: "Popina"
                }
            }
        });

        console.log(`📊 Found ${count} Popina transactions created today.`);

        if (count > 0) {
            const deleted = await prisma.cashTransaction.deleteMany({
                where: {
                    createdAt: {
                        gte: today
                    },
                    description: {
                        contains: "Popina"
                    }
                }
            });
            console.log(`✅ Deleted ${deleted.count} cash transactions.`);
        }

        // 2. Nettoyer ProcessedMail aussi
        const mailCount = await (prisma as any).processedMail.deleteMany({
            where: {
                createdAt: { gte: today },
                type: "POPINA_REPORT"
            }
        });
        console.log(`✅ Deleted ${mailCount.count} processed mail logs.`);

        console.log("✨ Cleanup completed successfully.");
    } catch (error) {
        console.error("❌ Error during cleanup:", error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
