
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

async function performFix() {
    'use server'
    console.log("🚑 STARTING FINANCE REPAIR ACTION...")

    // --- 1. BANQUE RESET ---
    // Date Cutoff : 20 Nov 2025 (Date Reprise Solde)
    const cutoff = new Date('2025-11-20')

    // Delete BANK TXs older than cutoff EXCEPT the Solde Initial
    await prisma.bankTransaction.deleteMany({
        where: {
            date: { lt: cutoff },
            description: { not: { contains: "SOLDE INITIAL" } }
        }
    })
    console.log("✅ Deleted OLD Bank transactions.")

    // --- 2. CAISSE FIX ---
    // Convert OUT positive to negative
    const wrongCash = await prisma.cashTransaction.findMany({
        where: { type: 'OUT', amount: { gt: 0 } }
    })

    for (const tx of wrongCash) {
        await prisma.cashTransaction.update({
            where: { id: tx.id },
            data: { amount: Number(tx.amount) * -1 }
        })
    }
    console.log(`✅ Fixed ${wrongCash.length} CASH OUT polarity.`)

    revalidatePath('/finance')
    redirect('/finance')
}


export default async function FixFinancePage() {
    // DIAGNOSTIC BANK
    const countBank = await prisma.bankTransaction.count()
    const cutoff = new Date('2025-11-20')
    const oldBank = await prisma.bankTransaction.count({
        where: { date: { lt: cutoff } }
    })

    // DIAGNOSTIC CASH
    const wrongCash = await prisma.cashTransaction.count({
        where: { type: 'OUT', amount: { gt: 0 } }
    })

    return (
        <div className="p-10 max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-red-600">🚑 RÉPARATION URGENTE</h1>

            <div className="bg-white p-6 rounded shadow border">
                <h2 className="font-bold mb-2">Diagnostic :</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong>Banque :</strong> {countBank} txs au total.
                        <br />
                        dont <span className="text-red-500 font-bold">{oldBank}</span> ANCIENNES (avant 20/11/2025) à supprimer.
                    </li>
                    <li>
                        <strong>Caisse :</strong>
                        <br />
                        <span className="text-red-500 font-bold">{wrongCash}</span> Sorties mal orientées (+ au lieu de -).
                    </li>
                </ul>

                <form action={performFix} className="mt-8">
                    <Button size="lg" variant="destructive" className="w-full font-bold">
                        🧹 NETTOYER ET CORRIGER TOUT
                    </Button>
                </form>
            </div>
        </div>
    )
}
