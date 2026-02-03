const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const prisma = new PrismaClient()

async function main() {
    const data = JSON.parse(fs.readFileSync('history_data.json', 'utf8'))
    console.log(`Clearing existing transactions...`)
    await prisma.bankTransaction.deleteMany({})

    console.log(`Starting import of ${data.length} transactions...`)

    // Batch create for speed
    const CHUNK_SIZE = 100
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE).map(tx => ({
            date: new Date(tx.date),
            amount: tx.amount,
            description: tx.description,
            status: 'PENDING'
        }))

        await prisma.bankTransaction.createMany({
            data: chunk,
            skipDuplicates: true
        })
        console.log(`Imported ${i + chunk.length} / ${data.length}`)
    }

    console.log(`Import finished.`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
