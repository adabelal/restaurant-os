
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth-utils"

// --- SERVER ACTIONS ---

async function cleanDuplicates() {
    'use server'
    await requireAuth()

    // 1. Clean Bank Duplicates
    const bankTx = await prisma.bankTransaction.findMany()
    const bankSeen = new Set()
    const bankToDelete = []

    for (const tx of bankTx) {
        const key = `${tx.date.toISOString().split('T')[0]}_${Number(tx.amount)}_${tx.description.trim()}`
        if (bankSeen.has(key)) {
            bankToDelete.push(tx.id)
        } else {
            bankSeen.add(key)
        }
    }

    if (bankToDelete.length > 0) {
        await prisma.bankTransaction.deleteMany({
            where: { id: { in: bankToDelete } }
        })
    }

    // 2. Clean Cash Duplicates
    const cashTx = await prisma.cashTransaction.findMany()
    const cashSeen = new Set()
    const cashToDelete = []

    for (const tx of cashTx) {
        const key = `${tx.date.toISOString().split('T')[0]}_${Number(tx.amount)}_${tx.type}`
        if (cashSeen.has(key)) {
            cashToDelete.push(tx.id)
        } else {
            cashSeen.add(key)
        }
    }

    if (cashToDelete.length > 0) {
        await prisma.cashTransaction.deleteMany({
            where: { id: { in: cashToDelete } }
        })
    }

    revalidatePath('/finance')
    revalidatePath('/finance/maintenance')

    return {
        success: true,
        deletedBank: bankToDelete.length,
        deletedCash: cashToDelete.length
    }
}

// --- PAGE COMPONENT ---

export default async function MaintenancePage() {
    // 1. Analyze Duplicates (Read-Only)
    const bankTx = await prisma.bankTransaction.findMany({ orderBy: { date: 'desc' } })
    const cashTx = await prisma.cashTransaction.findMany({ orderBy: { date: 'desc' } })

    // Analyze Cash Anomalies
    const topCash = [...cashTx].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 10)
    const totalCash = cashTx.reduce((sum, t) => sum + Number(t.amount), 0)

    // De-duplication logic (Read-only check)
    const bankSeen = new Set()
    let bankDuplicates = 0
    for (const tx of bankTx) {
        const key = `${tx.date.toISOString().split('T')[0]}_${Number(tx.amount)}_${tx.description.trim()}`
        if (bankSeen.has(key)) bankDuplicates++
        else bankSeen.add(key)
    }

    const cashSeen = new Set()
    let cashDuplicates = 0
    for (const tx of cashTx) {
        const key = `${tx.date.toISOString().split('T')[0]}_${Number(tx.amount)}_${tx.type}`
        if (cashSeen.has(key)) cashDuplicates++
        else cashSeen.add(key)
    }

    return (
        <div className="p-10 max-w-6xl mx-auto space-y-8 pb-20">
            <h1 className="text-3xl font-bold text-red-600 flex items-center gap-3">
                🛠️ Maintenance & Audit Finance
            </h1>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Transactions Bancaires</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-4xl font-bold">{bankTx.length}</div>
                        <div className="text-sm text-muted-foreground p-2 bg-slate-100 rounded flex justify-between">
                            <span>Doublons détectés:</span>
                            <span className={bankDuplicates > 0 ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                                {bankDuplicates}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Solde Caisse ({totalCash.toFixed(2)} €)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-4xl font-bold">{cashTx.length} entrées</div>
                        <div className="text-sm text-muted-foreground p-2 bg-slate-100 rounded flex justify-between">
                            <span>Doublons détectés:</span>
                            <span className={cashDuplicates > 0 ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                                {cashDuplicates}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* CASH INSPECTOR */}
            <Card className="border-orange-200 bg-orange-50/30">
                <CardHeader>
                    <CardTitle className="text-orange-900">🕵️ Inspecteur Caisse : Top 10 Montants</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-3 text-left">Date</th>
                                    <th className="p-3 text-left">Type</th>
                                    <th className="p-3 text-right">Montant</th>
                                    <th className="p-3 text-right">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topCash.map(tx => (
                                    <tr key={tx.id} className="border-b hover:bg-slate-50">
                                        <td className="p-3">{tx.date.toISOString().split('T')[0]}</td>
                                        <td className="p-3">{tx.type}</td>
                                        <td className="p-3 text-right font-bold">{Number(tx.amount).toFixed(2)} €</td>
                                        <td className="p-3 text-right text-muted-foreground">{tx.description || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                        *Si vous voyez ici des montants énormes ou suspects, c'est la cause de votre solde incorrect.
                    </p>
                </CardContent>
            </Card>

            {(bankDuplicates > 0 || cashDuplicates > 0) && (
                <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-red-900 mb-2">Nettoyage Requis</h3>
                    <form action={cleanDuplicates}>
                        <Button variant="destructive" size="lg" className="w-full font-bold">
                            🧹 SUPPRIMER LES {bankDuplicates + cashDuplicates} DOUBLONS
                        </Button>
                    </form>
                </div>
            )}

            {bankDuplicates === 0 && cashDuplicates === 0 && (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl flex items-center gap-4">
                    <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">✅</div>
                    <div>
                        <h3 className="text-lg font-bold text-emerald-900">Tout est propre !</h3>
                        <p className="text-emerald-800">Aucun doublon détecté dans votre base de données.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
