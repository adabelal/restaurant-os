const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
    const count = await prisma.bankTransaction.count()
    const latest = await prisma.bankTransaction.findFirst({ orderBy: { date: 'desc' } })
    console.log({ count, latest })
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
