
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Checking for positive OUT transactions...')

    const invalidTransactions = await prisma.cashTransaction.findMany({
        where: {
            type: 'OUT',
            amount: {
                gt: 0
            }
        }
    })

    console.log(`Found ${invalidTransactions.length} positive OUT transactions.`)

    if (invalidTransactions.length > 0) {
        console.log('🛠 Fixing transactions...')

        for (const tx of invalidTransactions) {
            await prisma.cashTransaction.update({
                where: { id: tx.id },
                data: {
                    amount: -tx.amount
                }
            })
            console.log(`  - Fixed tx ${tx.id}: ${tx.amount} -> ${-tx.amount}`)
        }
        console.log('✅ Fix complete.')
    } else {
        console.log('✅ No invalid transactions found.')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
