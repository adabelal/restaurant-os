import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const count = await prisma.bankTransaction.count()
  console.log("DB connection successful, tx count:", count)
}
main().finally(() => prisma.$disconnect())
