
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function inspectBank() {
    console.log("🏦 Inspection des Transactions Bancaires...")

    // 1. Count
    const count = await prisma.bankTransaction.count()
    console.log(`📊 Total Transactions: ${count}`)

    if (count === 0) return

    // 2. Date Range
    const first = await prisma.bankTransaction.findFirst({ orderBy: { date: 'asc' } })
    const last = await prisma.bankTransaction.findFirst({ orderBy: { date: 'desc' } })
    console.log(`📅 Période: ${first?.date.toISOString().split('T')[0]} -> ${last?.date.toISOString().split('T')[0]}`)

    // 3. Balance Calculation
    const aggregate = await prisma.bankTransaction.aggregate({
        _sum: { amount: true }
    })
    console.log(`💰 Solde Calculé (Somme): ${aggregate._sum.amount?.toFixed(2)} €`)

    // 4. Duplicate Detection (Simple)
    // Group by Date, Amount, Description -> Count > 1
    const duplicates = await prisma.bankTransaction.groupBy({
        by: ['date', 'amount', 'description'],
        having: {
            date: { _count: { gt: 1 } }
        },
        _count: { _all: true } // Use _all instead of date for count in output if possible, but having uses aggregation
    })

    // Since groupBy doesn't return the count directly in a nice way for "how many total duplicates", 
    // we just see how many groups have > 1 item.

    console.log(`⚠️ Groupes de Doublons Potentiels (Même Date/Montant/Desc): ${duplicates.length}`)

    if (duplicates.length > 0) {
        console.log("   Exemple de doublon:")
        const ex = duplicates[0]
        console.log(`   - ${ex.date.toISOString().split('T')[0]} | ${ex.amount} € | ${ex.description}`)
    }
}

inspectBank()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
