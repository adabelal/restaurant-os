
import { prisma } from "@/lib/prisma"
export const dynamic = 'force-dynamic'
import { Wallet, ArrowUpCircle, ArrowDownCircle, Calculator, Tags } from "lucide-react"
import { AddTransactionDialog } from "@/components/caisse/AddTransactionDialog"
import { ExportDialog } from "@/components/caisse/ExportDialog"
import { getAppSettings } from "@/app/caisse/actions"
import { ImportPopinaButton } from "@/components/caisse/ImportPopinaButton"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CaisseTransactionListClient, TransformedTx } from "./CaisseTransactionListClient"

export default async function CaissePage() {
    // Fetch initial data
    const transactions = await prisma.cashTransaction.findMany({
        orderBy: { date: 'desc' },
        include: {
            category: true,
            user: { select: { name: true } }
        }
    })

    const categories = await prisma.financeCategory.findMany({
        orderBy: { name: 'asc' }
    })

    const settings = await getAppSettings()

    // Calculate quick stats with Prisma Aggregations for performance (Anti-OOM)
    const [resultIn, resultOut] = await Promise.all([
        prisma.cashTransaction.aggregate({
            where: { amount: { gt: 0 } },
            _sum: { amount: true }
        }),
        prisma.cashTransaction.aggregate({
            where: { amount: { lt: 0 } },
            _sum: { amount: true }
        })
    ])

    const totalIn = Number(resultIn._sum.amount || 0)
    const totalOut = Number(resultOut._sum.amount || 0)
    const balance = totalIn + totalOut

    const transformedTransactions: TransformedTx[] = transactions.map((t: any) => ({
        id: t.id,
        date: t.date,
        amount: Number(t.amount),
        description: t.description,
        reference: t.reference || null,
        transactionType: t.type,
        paymentMethod: 'CASH',
        thirdPartyName: t.user ? t.user.name : null,
        categoryName: t.category?.name || null,
        categoryId: t.categoryId || null
    }))

    const transformedCategories = categories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type
    }))

    return (
        <main className="flex min-h-screen flex-col bg-background transition-colors duration-300 font-sans">

            {/* Header Section */}
            <div className="w-full bg-background md:bg-transparent pt-6 pb-2 md:pt-10 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-1.5 w-6 bg-amber-500 rounded-full" />
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em]">Module Finance</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight flex items-center gap-3">
                            Caisse
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                <Wallet className="h-6 w-6" />
                            </div>
                        </h1>
                        <p className="text-muted-foreground font-medium text-base mt-2">
                            Suivi temps réel des entrées et sorties d'espèces.
                        </p>
                    </div>

                    <div className="flex gap-2 flex-wrap items-center">
                        <Button asChild variant="outline" className="h-11 px-4 rounded-xl font-bold text-xs border-border/60 hover:bg-muted transition-all gap-2 shrink-0">
                            <Link href="/finance/categorisation">
                                <Tags className="w-4 h-4 text-amber-500" />
                                <span className="hidden sm:inline">Configuration</span>
                                <span className="sm:hidden text-[10px]">Config</span>
                            </Link>
                        </Button>

                        <div className="h-8 w-[1px] bg-border/40 mx-2 hidden lg:block" />

                        <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-2xl border border-border/40 shadow-sm">
                            <ImportPopinaButton />
                            <ExportDialog transactions={transactions} accountantEmail={settings?.accountantEmail} />
                        </div>

                        <AddTransactionDialog categories={categories} />
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                                <ArrowUpCircle className="h-5 w-5" />
                            </div>
                            <span className="text-emerald-500 text-[10px] font-black bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full uppercase tracking-wider border border-emerald-100 dark:border-emerald-800/30">Total Entrées</span>
                        </div>
                        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Flux Entrant</p>
                        <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">+{totalIn.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</h3>
                        <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <ArrowUpCircle className="h-24 w-24" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg">
                                <ArrowDownCircle className="h-5 w-5" />
                            </div>
                            <span className="text-rose-500 text-[10px] font-black bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-full uppercase tracking-wider border border-rose-100 dark:border-rose-800/30">Total Sorties</span>
                        </div>
                        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Flux Sortant</p>
                        <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{totalOut.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</h3>
                        <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <ArrowDownCircle className="h-24 w-24" />
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-6 rounded-2xl shadow-xl shadow-indigo-600/20 relative overflow-hidden group transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/20 text-white rounded-lg">
                                <Calculator className="h-5 w-5" />
                            </div>
                            <span className="text-white/80 text-[10px] font-black bg-white/10 px-2 py-1 rounded-full uppercase tracking-wider border border-white/10">Solde Actuel</span>
                        </div>
                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Balance Théorique</p>
                        <h3 className="text-3xl font-black text-white mt-1">
                            {balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </h3>
                        <div className="absolute bottom-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Calculator className="h-24 w-24" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-4 md:px-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">     <CaisseTransactionListClient
                initialTransactions={transformedTransactions}
                categories={transformedCategories}
            />
            </div>
        </main>
    )
}
