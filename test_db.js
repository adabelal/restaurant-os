const { PrismaClient } = require('@prisma/client')
process.env.DATABASE_URL = "postgres://postgres:MdpPOSTGRES1232026@localhost:5432/restaurant-os?sslmode=disable"
const prisma = new PrismaClient()

async function test() {
    console.log('Querying admin user...');
    const user = await prisma.user.findUnique({ where: { email: 'a.belal@siwa-bleury.fr' } })
    console.log('User found:', user)
}
test()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
