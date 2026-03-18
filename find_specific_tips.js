const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findTips() {
    try {
        const tips = await prisma.cashTransaction.findMany({
            where: {
                OR: [
                    { description: { contains: 'Pourboire', mode: 'insensitive' } },
                    { description: { contains: 'Popina', mode: 'insensitive' } }
                ]
            },
            orderBy: { date: 'asc' }
        });

        console.log("Total found:", tips.length);
        
        const matches = tips.filter(t => {
            const dateStr = t.date.toISOString();
            // User specified:
            // 07/06/2025 15:48 for 0,20€
            // 14/06/2025 16:55 for 0,18€
            
            const isMatch1 = dateStr.includes('2025-06-07T13:48') || dateStr.includes('2025-06-07T14:48') || dateStr.includes('2025-06-07T15:48');
            const isMatch2 = dateStr.includes('2025-06-14T14:55') || dateStr.includes('2025-06-14T15:55') || dateStr.includes('2025-06-14T16:55');
            
            return isMatch1 || isMatch2 || Number(t.amount) === 0.20 || Number(t.amount) === 0.18;
        });

        console.log("POTENTIAL EXEMPTIONS:");
        console.log(JSON.stringify(matches, null, 2));
        
        // Also print first 5 and last 5 to get a sense of the data
        console.log("SAMPLES:");
        console.log(JSON.stringify(tips.slice(0, 5), null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

findTips();
