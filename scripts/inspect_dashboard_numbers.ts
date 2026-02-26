
import { prisma } from "@/lib/prisma"

async function inspect() {
    console.log("🔍 INSPECTION DIAGNOSTIC\n")

    // 1. BANQUE
    const bankSum = await prisma.bankTransaction.aggregate({ _sum: { amount: true } })
    const bankCount = await prisma.bankTransaction.count()
    const firstBank = await prisma.bankTransaction.findFirst({ orderBy: { date: 'asc' } })
    const lastBank = await prisma.bankTransaction.findFirst({ orderBy: { date: 'desc' } })

    console.log(`🏦 BANQUE: ${bankCount} txs`)
    console.log(`   Solde Total: ${bankSum._sum.amount} €`)
    console.log(`   Date Début: ${firstBank?.date.toISOString().split('T')[0]}`)
    console.log(`   Date Fin:   ${lastBank?.date.toISOString().split('T')[0]}`)

    // Check for "Solde Initial"
    const initTx = await prisma.bankTransaction.findFirst({
        where: { description: { contains: "SOLDE INITIAL" } }
    })
    console.log(`   🏁 Solde Initial trouvé: ${initTx ? initTx.amount + ' €' : 'NON'}`)

    // 2. CAISSE
    const cashSum = await prisma.cashTransaction.aggregate({ _sum: { amount: true } })
    const cashCount = await prisma.cashTransaction.count()

    console.log(`\n💵 CAISSE: ${cashCount} txs`)
    console.log(`   Solde Théorique: ${cashSum._sum.amount} €`)

    // Check Sorties vs Entrées
    const cashIn = await prisma.cashTransaction.aggregate({
        where: { amount: { gt: 0 } },
        _sum: { amount: true }
    })
    const cashOut = await prisma.cashTransaction.aggregate({
        where: { amount: { lt: 0 } },
        _sum: { amount: true }
    })

    console.log(`   Entrées (Ventes): +${cashIn._sum.amount?.toFixed(2)} €`)
    console.log(`   Sorties (Dépôts?): ${cashOut._sum.amount?.toFixed(2)} €`)

}

inspect()
