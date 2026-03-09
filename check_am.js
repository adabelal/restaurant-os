const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        where: { name: { contains: 'Amelie', mode: 'insensitive' } },
        include: {
            documents: { where: { type: 'PAYSLIP' } },
            monthlySalaries: true
        }
    })

    console.log(JSON.stringify(users, null, 2))
}

main().finally(() => prisma.$disconnect())
