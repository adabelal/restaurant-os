
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function DebugFinancePage() {
    // 1. BANQUE
    const bankSum = await prisma.bankTransaction.aggregate({ _sum: { amount: true } })
    const bankCount = await prisma.bankTransaction.count()
    const firstBank = await prisma.bankTransaction.findFirst({ orderBy: { date: 'asc' } })
    const lastBank = await prisma.bankTransaction.findFirst({ orderBy: { date: 'desc' } })

    // Check for "Solde Initial"
    const initTx = await prisma.bankTransaction.findFirst({
        where: { description: { contains: "SOLDE INITIAL" } }
    })

    // Find anomalies (duplicates?)
    // This is expensive but useful for debug
    const allBank = await prisma.bankTransaction.findMany({
        select: { id: true, amount: true, date: true, description: true }
    })

    let totalCalc = 0
    allBank.forEach(tx => totalCalc += Number(tx.amount))

    // 2. CAISSE
    const cashSum = await prisma.cashTransaction.aggregate({ _sum: { amount: true } })
    const cashCount = await prisma.cashTransaction.count()

    const cashIn = await prisma.cashTransaction.aggregate({
        where: { amount: { gt: 0 } },
        _sum: { amount: true }
    })
    const cashOut = await prisma.cashTransaction.aggregate({
        where: { amount: { lt: 0 } },
        _sum: { amount: true }
    })

    return (
        <div className="p-10 font-mono text-sm space-y-4">
            <h1 className="text-xl font-bold">🔍 DIAGNOSTIC FINANCE</h1>

            <div className="border p-4 rounded bg-slate-50">
                <h2 className="font-bold text-lg mb-2">🏦 BANQUE</h2>
                <p>Nombre de txs: <strong>{bankCount}</strong></p>
                <p>Solde (via SQL Aggregate): <strong>{Number(bankSum._sum.amount).toFixed(2)} €</strong></p>
                <p>Solde (via JS Sum loop): <strong>{totalCalc.toFixed(2)} €</strong></p>
                <hr className="my-2" />
                <p>Date Début: {firstBank?.date.toLocaleDateString()}</p>
                <p>Date Fin: {lastBank?.date.toLocaleDateString()}</p>
                <hr className="my-2" />
                <p>SOLDE INITIAL (Reprise) :</p>
                <pre className="bg-white p-2 border rounded">
                    {initTx ? JSON.stringify(initTx, null, 2) : "❌ NON TROUVÉ"}
                </pre>
            </div>

            <div className="border p-4 rounded bg-amber-50">
                <h2 className="font-bold text-lg mb-2">💵 CAISSE</h2>
                <p>Nombre de txs: <strong>{cashCount}</strong></p>
                <p>Solde Théorique: <strong>{Number(cashSum._sum.amount).toFixed(2)} €</strong></p>
                <hr className="my-2" />
                <p>TOTAL ENTRÉES (+): {Number(cashIn._sum.amount).toFixed(2)} €</p>
                <p>TOTAL SORTIES (-): {Number(cashOut._sum.amount).toFixed(2)} €</p>
            </div>

            <div className="mt-8">
                <h3 className="font-bold">Dernières 10 Transactions Banque :</h3>
                <ul className="list-disc pl-5">
                    {allBank.slice(0, 10).map(t => (
                        <li key={t.id}>{new Date(t.date).toLocaleDateString()} - {t.amount} € - {t.description}</li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
