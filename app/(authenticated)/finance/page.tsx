import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    TrendingUp,
    Upload,
    CalendarDays,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    ShoppingCart
} from "lucide-react"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// Helper to fetch stats
async function getFinanceStats() {
    const today = new Date()
    const currentDay = today.getDate()

    // 1. Calculate Current Balance from Bank Transactions
    const transactions = await prisma.bankTransaction.findMany({
        select: { amount: true }
    })
    const currentBalance = transactions.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

    // 2. Fixed Costs
    const fixedCosts = await prisma.fixedCost.findMany()

    // Total monthly lissés
    const monthlyFixedCost = fixedCosts.reduce((sum: number, cost: any) => {
        const amount = Number(cost.amount || 0)
        switch (cost.frequency) {
            case 'MONTHLY': return sum + amount
            case 'QUARTERLY': return sum + (amount / 3)
            case 'YEARLY': return sum + (amount / 12)
            default: return sum
        }
    }, 0)

    // Remaining fixed costs for THIS month
    const remainingFixedCosts = fixedCosts
        .filter((cost: any) => cost.frequency === 'MONTHLY' && cost.dayOfMonth > currentDay && cost.isActive)
        .reduce((sum: number, cost: any) => sum + Number(cost.amount || 0), 0)

    // 3. Unpaid Purchase Orders (Not reconciled with bank)
    const unpaidPOs = await prisma.purchaseOrder.findMany({
        where: {
            bankTransactions: {
                none: {}
            }
        },
        select: { id: true, totalAmount: true }
    })
    const totalUnpaidPOs = unpaidPOs.reduce((sum: number, po: any) => sum + Number(po.totalAmount || 0), 0)

    // 4. Projection Fin de Mois
    const eomForecast = currentBalance - remainingFixedCosts - totalUnpaidPOs

    // 5. Last 5 Transactions for preview
    const recentTransactions = await prisma.bankTransaction.findMany({
        take: 5,
        orderBy: { date: 'desc' }
    })

    return {
        currentBalance,
        monthlyFixedCost,
        remainingFixedCosts,
        totalUnpaidPOs,
        unpaidPOs,
        eomForecast,
        recentTransactions
    }
}

export default async function FinancePage() {
    const {
        currentBalance,
        remainingFixedCosts,
        totalUnpaidPOs,
        unpaidPOs,
        eomForecast,
        recentTransactions
    } = await getFinanceStats()

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 space-y-8 p-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-emerald-600" />
                        Finance & Pilotage
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Suivez votre cash-flow et anticipez vos décaissements.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button asChild variant="outline" className="shadow-sm">
                        <Link href="/finance/import">
                            <Upload className="mr-2 h-4 w-4" />
                            Importer Relevé
                        </Link>
                    </Button>
                    <Button asChild className="shadow-sm bg-slate-900 text-white hover:bg-slate-800">
                        <Link href="/finance/charges">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            Gérer Charges Fixes
                        </Link>
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Solde Bancaire
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Prélèvements à venir
                        </CardTitle>
                        <CalendarDays className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {remainingFixedCosts.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Factures non payées
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">
                            {totalUnpaidPOs.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-600 text-white shadow-md border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">
                            Est. Fin de Mois
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 opacity-90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {eomForecast.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-[10px] opacity-80 mt-1">
                            Projection hors CA futur
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Recent Transactions */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>Dernières Transactions Importées</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentTransactions.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    Aucune transaction importée. Commencez par importer un relevé.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentTransactions.map((t: any) => (
                                        <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${Number(t.amount) >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                    {Number(t.amount) >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{t.description}</p>
                                                    <p className="text-xs text-slate-500">{t.date.toLocaleDateString('fr-FR')}</p>
                                                </div>
                                            </div>
                                            <div className={`font-bold ${Number(t.amount) >= 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                                                {Number(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Alerts */}
                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-emerald-400">Pilotage Intelligent</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-white/10 rounded-lg border border-white/10 text-sm">
                                <p className="font-medium text-white mb-1">Alertes Factures</p>
                                <p className="text-slate-400">
                                    Vous avez {unpaidPOs.length} factures non réconciliées avec votre banque.
                                </p>
                            </div>
                            <p className="text-sm text-slate-300">
                                Le solde prévisionnel vous aide à anticiper si vous pourrez payer vos fournisseurs à la fin du mois.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
