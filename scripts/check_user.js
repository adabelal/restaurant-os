const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUser() {
    const email = 'a.belal@siwa-bleury.fr'.toLowerCase()
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            isActive: true,
            role: true,
            password: true
        }
    })

    if (!user) {
        console.log('User not found')
        const allUsers = await prisma.user.findMany({ select: { email: true } })
        console.log('Available emails:', allUsers.map(u => u.email))
    } else {
        console.log('User found:', user)
    }
}

checkUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
