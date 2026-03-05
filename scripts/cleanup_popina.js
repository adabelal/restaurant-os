
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Manuel .env loading because --env-file is failing
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

const prisma = new PrismaClient();

async function cleanup() {
    console.log("🚀 Starting cleanup of Caisse data created today...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        // 1. Compter les transactions Popina à supprimer
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
        try {
            const mailCount = await prisma.processedMail.deleteMany({
                where: {
                    date: { gte: today },
                    type: "POPINA_REPORT"
                }
            });
            console.log(`✅ Deleted ${mailCount.count} processed mail logs.`);
        } catch (e) {
            console.warn("⚠️ ProcessedMail cleanup skipped helper:", e.message);
        }

        console.log("✨ Cleanup completed successfully.");
    } catch (error) {
        console.error("❌ Error during cleanup:", error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
