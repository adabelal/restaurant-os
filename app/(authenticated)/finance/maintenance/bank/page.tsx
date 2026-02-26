
import fs from 'fs'
import path from 'path'
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { revalidatePath } from "next/cache"

// PATH TO BANK STATEMENTS (Adjust for your specific machine)
const BANK_STATEMENTS_PATH = '/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/FINANCE/Banque'

async function clearBankData() {
    'use server'
    await requireAuth()
    await prisma.bankTransaction.deleteMany()
    revalidatePath('/finance')
}

// Separate delete function for form action
async function deleteBankDuplicates() {
    'use server'
    await requireAuth()
    await cleanBankDuplicates()
    revalidatePath('/finance')
}


async function inspectBank() {
    'use server'
    await requireAuth()

    console.log("🏦 --- AUDIT BANQUE ---")

    // 1. Stats & Dates
    const count = await prisma.bankTransaction.count()
    const lastTx = await prisma.bankTransaction.findFirst({ orderBy: { date: 'desc' } })
    const lastDate = lastTx ? lastTx.date : null

    // 2. Check duplicates
    const items = await prisma.bankTransaction.findMany({ select: { date: true, amount: true, description: true, id: true } })

    // Group manually
    const groups = new Map<string, string[]>()
    items.forEach((i: any) => {
        const key = `${i.date.toISOString().split('T')[0]}_${i.amount}_${i.description}`
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(i.id)
    })

    let duplicateIds: string[] = []
    let duplicateGroups = 0
    groups.forEach((ids) => {
        if (ids.length > 1) {
            duplicateGroups++
            ids.slice(1).forEach(id => duplicateIds.push(id))
        }
    })

    // 3. List Statements (PDFs)
    let statements: string[] = []
    let statementsFound = false
    try {
        if (fs.existsSync(BANK_STATEMENTS_PATH)) {
            statementsFound = true;
            const files = fs.readdirSync(BANK_STATEMENTS_PATH)
            statements = files.filter((f: string) => f.toLowerCase().endsWith('.pdf')).sort().reverse()
        }
    } catch (e) {
        console.error("Error reading statements dir:", e)
    }

    return { count, lastDate, duplicateGroups, duplicateIdsCount: duplicateIds.length, statements, statementsPath: BANK_STATEMENTS_PATH, statementsFound }
}

async function cleanBankDuplicates() {
    // Logic extracted
    const items = await prisma.bankTransaction.findMany({ select: { date: true, amount: true, description: true, id: true } })
    const groups = new Map<string, string[]>()
    items.forEach((i: any) => {
        const key = `${i.date.toISOString().split('T')[0]}_${i.amount}_${i.description}`
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(i.id)
    })

    let idsToDelete: string[] = []
    groups.forEach((ids) => {
        if (ids.length > 1) {
            ids.slice(1).forEach(id => idsToDelete.push(id))
        }
    })

    if (idsToDelete.length > 0) {
        await prisma.bankTransaction.deleteMany({
            where: { id: { in: idsToDelete } }
        })
    }
}

export default async function BankMaintenancePage() {
    const stats = await inspectBank()

    const balanceResult = await prisma.bankTransaction.aggregate({ _sum: { amount: true } })
    const balance = Number(balanceResult._sum.amount || 0)

    return (
        <div className="p-10 max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">🏦 Maintenance Transactions Bancaires</h1>

            {/* ALERT BOX DE NETTOYAGE */}
            <div className="bg-slate-800 text-white p-6 rounded-lg shadow-lg flex justify-between items-center">
                <div>
                    <div className="text-sm font-bold opacity-50">SOLDE BANQUE ACTUEL</div>
                    <div className="text-4xl font-mono">{balance.toFixed(2)} €</div>
                    {stats.lastDate && (
                        <div className="text-sm mt-1 text-emerald-300 font-bold">
                            Arrêté au {stats.lastDate.toLocaleDateString()}
                        </div>
                    )}
                </div>
                <div className="text-right flex flex-col items-end gap-3">
                    <div>
                        <div className="text-sm font-bold opacity-50">TRANSACTIONS</div>
                        <div className="text-2xl">{stats.count}</div>
                    </div>

                    <form action={clearBankData}>
                        <Button variant="destructive" size="sm" className="font-bold border border-red-400 hover:bg-red-700">
                            🧨 VIDER BASE BANQUE (RESET)
                        </Button>
                    </form>
                </div>
            </div>

            <div className={`p-6 rounded-lg border ${stats.duplicateGroups > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <h3 className="font-bold text-lg mb-2">Diagnostic Doublons</h3>
                {stats.duplicateGroups > 0 ? (
                    <div>
                        <p className="text-red-700 mb-4">
                            ⚠️ <strong>{stats.duplicateGroups} groupes de doublons détectés.</strong>
                            <br />
                            Cela représente {stats.duplicateIdsCount} transactions en trop.
                        </p>
                        <form action={deleteBankDuplicates}>
                            <Button variant="destructive" size="lg" className="w-full font-bold">
                                🧹 SUPPRIMER LES {stats.duplicateIdsCount} DOUBLONS
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="text-green-700 flex items-center gap-2">
                        <span>✅ Aucuns doublons stricts détectés.</span>
                    </div>
                )}
            </div>

            {/* SECTION RELEVÉS PDF */}
            <div className="border rounded-lg p-6 bg-white shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    📄 Relevés Bancaires (Dossier Local)
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-normal truncate max-w-[400px] hidden md:inline-block" title={stats.statementsPath}>
                        {stats.statementsPath.split('/').pop()}
                    </span>
                </h3>

                {stats.statementsFound ? (
                    stats.statements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                            {stats.statements.map((file: string) => (
                                <div key={file} className="flex items-center gap-2 border p-2 rounded hover:bg-slate-50 group">
                                    <a
                                        href={`/api/documents/serve?path=${encodeURIComponent(path.join(stats.statementsPath, file))}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center gap-3"
                                    >
                                        <div className="bg-red-100 text-red-600 p-2 rounded group-hover:bg-red-200">PDF</div>
                                        <span className="truncate font-medium text-slate-700 text-sm">{file}</span>
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-slate-400 italic text-center p-8 bg-slate-50 rounded border border-dashed">
                            Dossier vide (aucun .pdf).
                        </div>
                    )
                ) : (
                    <div className="text-orange-600 bg-orange-50 p-4 rounded border border-orange-200 text-sm">
                        ⚠️ Dossier introuvable.<br />
                        <div className="font-mono text-xs mt-2 bg-white p-2 rounded border truncate select-all">
                            {stats.statementsPath}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
