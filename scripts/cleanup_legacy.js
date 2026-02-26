const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Cleaning up legacy adjustment...')
    const deleted = await prisma.bankTransaction.deleteMany({
        where: { description: "RAPPORT DE SOLDE INITIAL" }
    })
    console.log(`Deleted ${deleted.count} legacy adjustment transactions.`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
