
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
            <div className="w-full bg-background md:bg-transparent pt-4 pb-0 md:pt-8 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-8 bg-amber-500 rounded-full" />
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Module Caisse</span>
                        </div>
                        <h1 className="text-5xl font-black text-foreground tracking-tighter flex items-center gap-4">
                            Caisse
                            <Wallet className="h-8 w-8 text-amber-500" />
                        </h1>
                        <p className="text-muted-foreground font-bold text-lg max-w-md leading-tight">
                            Suivi des entrées et sorties de monnaie physiques.
                        </p>
                    </div>

                    <div className="flex gap-3 flex-wrap mt-4 md:mt-0">
                        <Button asChild variant="outline" className="h-14 px-6 rounded-2xl border-2 border-border font-black uppercase tracking-widest text-xs hover:bg-foreground hover:text-background transition-all duration-300 gap-2 shrink-0">
                            <Link href="/finance/categorisation">
                                <Tags className="w-4 h-4" />
                                <span className="hidden sm:inline">Catégorisation</span>
                            </Link>
                        </Button>
                        <ImportPopinaButton />
                        <ExportDialog transactions={transactions} accountantEmail={settings?.accountantEmail} />
                        <AddTransactionDialog categories={categories} />
                    </div>
                </div>
            </div>

            <div className="flex-1 px-4 py-8 md:px-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="border-none ring-1 ring-border shadow-2xl bg-card rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 relative group p-6 flex flex-col gap-2">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <ArrowUpCircle className="h-4 w-4 text-emerald-500" /> Total Entrées
                        </span>
                        <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 relative">+{totalIn.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="border-none ring-1 ring-border shadow-2xl bg-card rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 relative group p-6 flex flex-col gap-2">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <ArrowDownCircle className="h-4 w-4 text-rose-500" /> Total Sorties
                        </span>
                        <span className="text-3xl font-black text-rose-600 dark:text-rose-400 relative">{totalOut.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="border-none ring-1 ring-blue-500/20 shadow-2xl bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 relative group p-6 flex flex-col gap-2">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 relative">
                            <Calculator className="h-4 w-4 text-blue-500" /> Solde Théorique
                        </span>
                        <span className={`text-3xl font-black relative ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                    </div>
                </div>

                <CaisseTransactionListClient
                    initialTransactions={transformedTransactions}
                    categories={transformedCategories}
                />
            </div>
        </main>
    )
}
