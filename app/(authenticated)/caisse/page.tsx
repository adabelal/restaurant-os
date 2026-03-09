
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
        <main className="flex min-h-screen flex-col bg-[#F8FAFC] p-6 md:p-10 max-w-[1600px] mx-auto font-sans transition-colors duration-300">

            {/* Header Section */}
            <div className="w-full mb-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">
                            Caisse
                        </h1>
                        <p className="text-slate-500 font-medium text-base">
                            Suivi en temps réel des entrées et sorties d'espèces de l'établissement.
                        </p>
                    </div>

                    <div className="flex gap-3 flex-wrap items-center">
                        <Button asChild variant="outline" className="h-11 px-5 rounded-xl border-slate-200 bg-white shadow-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all gap-2 text-sm">
                            <Link href="/finance/categorisation">
                                <Tags className="w-4 h-4 text-slate-400" />
                                Configuration
                            </Link>
                        </Button>

                        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                            <ImportPopinaButton />
                            <ExportDialog transactions={transactions} accountantEmail={settings?.accountantEmail} />
                        </div>

                        <AddTransactionDialog categories={categories} />
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[24px] overflow-hidden relative pt-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-6">
                        <CardTitle className="text-sm font-semibold text-slate-500">
                            Total Entrées
                        </CardTitle>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold text-[11px] px-2 py-0.5 rounded-full">
                            Flux Entrant
                        </Badge>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="text-[32px] font-bold text-emerald-600 tracking-tight mb-4">
                            +{totalIn.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[60%]" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[24px] overflow-hidden relative pt-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-6">
                        <CardTitle className="text-sm font-semibold text-slate-500">
                            Total Sorties
                        </CardTitle>
                        <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-none font-bold text-[11px] px-2 py-0.5 rounded-full">
                            Flux Sortant
                        </Badge>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="text-[32px] font-bold text-rose-600 tracking-tight mb-4">
                            {totalOut.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 w-[40%]" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[24px] overflow-hidden relative pt-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-6">
                        <CardTitle className="text-sm font-semibold text-slate-500">
                            Solde Actuel
                        </CardTitle>
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none font-bold text-[11px] px-2 py-0.5 rounded-full">
                            Balance Théorique
                        </Badge>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="text-[32px] font-bold text-[#0F172A] tracking-tight mb-4">
                            {balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[80%]" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CaisseTransactionListClient
                    initialTransactions={transformedTransactions}
                    categories={transformedCategories}
                />
            </div>
        </main>
    )
}
