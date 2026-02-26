import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    const data = JSON.parse(fs.readFileSync('./history_data.json', 'utf8'))
    console.log(`Starting import of ${data.length} transactions...`)

    let imported = 0
    let skipped = 0

    // Split into chunks to avoid database timeouts
    const chunkSize = 100
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize)

        await Promise.all(chunk.map(async (tx) => {
            const date = new Date(tx.date)
            // Search for existing
            const existing = await prisma.bankTransaction.findFirst({
                where: {
                    date: date,
                    amount: tx.amount,
                    description: tx.description
                }
            })

            if (!existing) {
                await prisma.bankTransaction.create({
                    data: {
                        date: date,
                        amount: tx.amount,
                        description: tx.description,
                        status: 'PENDING'
                    }
                })
                imported++
            } else {
                skipped++
            }
        }))
        console.log(`Processed ${Math.min(i + chunkSize, data.length)} / ${data.length}...`)
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
