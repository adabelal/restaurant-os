
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { requireAuth } from "@/lib/auth-utils"
import * as xlsx from 'xlsx'
import fs from 'fs'
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const FINAL_FILE = process.cwd() + '/FINAL_IMPORT_READY.xlsx';

function excelDateToJSDate(serial: any) {
    // If string "YYYY-MM-DD", parse it
    if (typeof serial === 'string') return new Date(serial);
    // If number (Excel serial), convert
    if (typeof serial === 'number') {
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        return new Date(utc_value * 1000);
    }
    return new Date();
}

async function performFinalImport() {
    'use server'
    await requireAuth()

    console.log("🚀 STARTING FINAL BANK IMPORT...")

    try {
        // 1. CLEAR CURRENT BANK DATA
        await prisma.bankTransaction.deleteMany()
        console.log("🧹 DB Cleared.")

        if (!fs.existsSync(FINAL_FILE)) {
            console.error("❌ FINAL FILE NOT FOUND")
            return { success: false, error: "Fichier Final introuvable" }
        }

        const buffer = fs.readFileSync(FINAL_FILE)
        const wb = xlsx.read(buffer, { type: 'buffer' })
        const sheetName = wb.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]) as any[]

        console.log(`📄 Final File: Found ${data.length} rows.`)

        let count = 0;

        for (const row of data) {
            try {
                let dateStr = row['Date'];
                if (!dateStr) continue;

                let date = excelDateToJSDate(dateStr);

                const amount = parseFloat(row['Montant']) || 0;
                const description = row['Libellé'] || 'Import';
                const source = row['Source'] || 'MANUAL';

                if (amount === 0) continue;

                await prisma.bankTransaction.create({
                    data: {
                        date,
                        amount,
                        description,
                        reference: source,
                        status: 'PENDING'
                    }
                })
                count++;

            } catch (e) {
                console.log(`⚠️ Error Row`, e)
            }
        }
        console.log(`✅ FINAL IMPORT COMPLETE: ${count} transactions`)

    } catch (e) {
        console.error("🔥 CRITICAL IMPORT ERROR:", e)
        return { success: false, error: String(e) }
    }

    revalidatePath('/finance')
    redirect('/finance')
}

export default async function FinalImportPage() {
    let fileFound = false;
    try { if (fs.existsSync(FINAL_FILE)) fileFound = true; } catch { }

    const count = await prisma.bankTransaction.count()

    const balance = await prisma.bankTransaction.aggregate({
        _sum: { amount: true }
    }).then(res => res._sum.amount || 0)

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-indigo-600 p-6 text-center">
                    <h1 className="text-2xl font-bold text-white">🚀 Import Finale Banque</h1>
                    <p className="text-indigo-200 text-sm mt-2">Le Grand Reset (3 derniers mois)</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center text-sm text-slate-500 border-b pb-4">
                        <span>État Actuel :</span>
                        <span className="font-mono font-bold text-slate-800">{count} txs / {Number(balance).toFixed(2)} €</span>
                    </div>

                    <div className={`p-4 rounded border text-center ${fileFound ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        <div className="text-xs uppercase font-bold mb-1">Fichier Source</div>
                        <div className="font-mono text-sm break-all">FINAL_IMPORT_READY.xlsx</div>
                        <div className="mt-2 text-xl">{fileFound ? '✅ PRÊT' : '❌ MANQUANT'}</div>
                    </div>

                    <form action={performFinalImport}>
                        <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold h-14 text-lg shadow-lg transition-transform active:scale-95" disabled={!fileFound}>
                            ⚡️ LANCER L'IMPORT
                        </Button>
                    </form>

                    <p className="text-xs text-center text-slate-400">
                        Ceci va écraser l'historique bancaire actuel et le remplacer par les données validées (Nov 25 - Fév 26).
                    </p>
                </div>
            </div>
        </div>
    )
}
