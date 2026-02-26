
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function audit() {
    console.log("🔍 Audit des transactions...")

    // 1. Check Bank Transactions
    const bankTx = await prisma.bankTransaction.findMany()
    console.log(`📊 Total Bank Transactions: ${bankTx.length}`)

    const bankDuplicates = new Map()
    let bankDupCount = 0

    for (const tx of bankTx) {
        // Create a unique key based on date, amount, and description
        const key = `${tx.date.toISOString().split('T')[0]}_${tx.amount}_${tx.description.trim()}`
        if (bankDuplicates.has(key)) {
            bankDuplicates.get(key).push(tx.id)
            bankDupCount++
        } else {
            bankDuplicates.set(key, [tx.id])
        }
    }
    console.log(`⚠️ Potential Bank Duplicates: ${bankDupCount}`)


    // 2. Check Cash Transactions
    const cashTx = await prisma.cashTransaction.findMany()
    console.log(`📊 Total Cash Transactions: ${cashTx.length}`)

    const cashDuplicates = new Map()
    let cashDupCount = 0

    for (const tx of cashTx) {
        const key = `${tx.date.toISOString().split('T')[0]}_${tx.amount}_${tx.type}`
        if (cashDuplicates.has(key)) {
            cashDuplicates.get(key).push(tx.id)
            cashDupCount++
        } else {
            cashDuplicates.set(key, [tx.id])
        }
    }
    console.log(`⚠️ Potential Cash Duplicates: ${cashDupCount}`)

    // 3. Show Sample Duplicates
    if (bankDupCount > 0) {
        console.log("\nExemple de doublons BANQUE :")
        let shown = 0
        for (const [key, ids] of bankDuplicates.entries()) {
            if (ids.length > 1 && shown < 3) {
                console.log(`Key: ${key} -> ${ids.length} copies found.`)
                shown++
            }
        }
    }

    if (cashDupCount > 0) {
        console.log("\nExemple de doublons CAISSE :")
        let shown = 0
        for (const [key, ids] of cashDuplicates.entries()) {
            if (ids.length > 1 && shown < 3) {
                console.log(`Key: ${key} -> ${ids.length} copies found.`)
                shown++
            }
        }
    }
}

audit()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect())
