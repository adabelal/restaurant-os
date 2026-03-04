import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const txs = await prisma.bankTransaction.findMany()
  
  // Find duplicates based on description and amount and date (within same day)
  const map = {}
  const duplicates = []
  
  for (const t of txs) {
    const dStr = t.date.toISOString().slice(0, 10)
    const key = `${dStr}_${t.amount}_${t.description}`
    if (map[key]) {
      duplicates.push({ ...t, reason: 'Exact match date, amount, desc' })
    } else {
      map[key] = t
    }
  }
  
  console.log(`Found ${duplicates.length} duplicates out of ${txs.length} total txs.`)
  if (duplicates.length > 0) {
    console.log("Example:", duplicates.slice(0, 3).map(d => ({desc: d.description, amount: d.amount, date: d.date})))
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
