const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const prisma = new PrismaClient()

async function main() {
    const data = JSON.parse(fs.readFileSync('history_data.json', 'utf8'))
    console.log(`Starting import of ${data.length} transactions...`)

    let imported = 0
    let skipped = 0

    for (const tx of data) {
        // Simple duplicate check based on date, amount and description
        const existing = await prisma.bankTransaction.findFirst({
            where: {
                date: new Date(tx.date),
                amount: tx.amount,
                description: tx.description
            }
        })

        if (!existing) {
            await prisma.bankTransaction.create({
                data: {
                    date: new Date(tx.date),
                    amount: tx.amount,
                    description: tx.description,
                    status: 'PENDING'
                }
            })
            imported++
        } else {
            skipped++
        }
    }

    console.log(`Import finished. Imported: ${imported}, Skipped: ${skipped}`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
