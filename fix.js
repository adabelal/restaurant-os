const { PrismaClient } = require("/Users/adambelal/Desktop/restaurant-os/node_modules/@prisma/client")
const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.financeCategory.findMany()
  const oldCat = categories.find(c => c.name.toLowerCase().includes("pourboire") && c.type === "REVENUE")
  const newCat = categories.find(c => c.name.toLowerCase().includes("pourboire") && c.type === "TRANSIT")
  
  if (!oldCat || !newCat) {
    console.log("Categories missing")
    return
  }
  
  const r1 = await prisma.cashTransaction.updateMany({where: {categoryId: oldCat.id}, data: {categoryId: newCat.id}})
  const r2 = await prisma.bankTransaction.updateMany({where: {categoryId: oldCat.id}, data: {categoryId: newCat.id}})
  
  await prisma.financeCategory.delete({where: {id: oldCat.id}})
  console.log(`Updated ${r1.count} cash, ${r2.count} bank. Old category deleted!`)
  await prisma.$disconnect()
}
main()
