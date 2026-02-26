
import { prisma } from "@/lib/prisma"

async function fixFinanceData() {
    console.log("🚑 STARTING FINANCE REPAIR...\n")

    // --- 1. REPAIR BANK ---
    console.log("🏦 FIXING BANK DATA...")

    // Date limite : 20 Novembre 2025 (Date du Solde Initial Reprise)
    const cutOffDate = new Date("2025-11-20T00:00:00.000Z")

    // Delete older transactions EXCEPT the "SOLDE INITIAL" one (just in case date is same)
    const deletedBank = await prisma.bankTransaction.deleteMany({
        where: {
            date: { lt: cutOffDate },
            description: { not: { contains: "SOLDE INITIAL" } }
        }
    })
    console.log(`   👉 Deleted ${deletedBank.count} old/OCR transactions (before 20/11/2025).`)

    // --- 2. REPAIR CASH ---
    console.log("\n💵 FIXING CASH DATA...")

    // Find all 'OUT' transactions with positive amounts
    const wrongCashTxs = await prisma.cashTransaction.findMany({
        where: {
            type: 'OUT',
            amount: { gt: 0 }
        }
    })

    console.log(`   👉 Found ${wrongCashTxs.length} CASH OUT transactions with positive amounts. Fixing...`)

    let fixedCount = 0
    for (const tx of wrongCashTxs) {
        await prisma.cashTransaction.update({
            where: { id: tx.id },
            data: { amount: Number(tx.amount) * -1 }
        })
        fixedCount++
    }
    console.log(`   ✅ Converted ${fixedCount} transactions to negative amounts.`)

    console.log("\n✨ REPAIR COMPLETE.")
}

fixFinanceData()
