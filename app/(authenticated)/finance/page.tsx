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
    ShoppingCart,
    ArrowRight
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { BalanceChart } from "@/components/finance/BalanceChart"
import { SyncIntelligenceButton } from "@/components/finance/SyncIntelligenceButton"

export const dynamic = 'force-dynamic'

import { getBalanceChartData, getFinanceStats } from "./actions"

export default async function FinancePage() {
    const {
        currentBalance,
        remainingFixedCosts,
        totalUnpaidPOs,
        unpaidPOs,
        eomForecast,
        recentTransactions,
        chartData
    } = await getFinanceStats()

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 to-emerald-800 p-8 shadow-xl text-white">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200">
                            <TrendingUp className="h-8 w-8 text-emerald-400" />
                            Finance & Pilotage
                        </h1>
                        <p className="mt-2 text-emerald-100/80 font-medium max-w-xl text-lg">
                            Vision 360° de votre trésorerie et pilotage en temps réel.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <SyncIntelligenceButton />
                        <Button asChild variant="secondary" className="shadow-lg bg-white text-emerald-900 hover:bg-emerald-50">
                            <Link href="/finance/import">
                                <Upload className="mr-2 h-4 w-4" />
                                Importer Relevé
                            </Link>
                        </Button>
                        <Button asChild className="shadow-lg bg-emerald-950 text-white border border-emerald-800 hover:bg-emerald-900">
                            <Link href="/finance/charges">
                                <CalendarDays className="mr-2 h-4 w-4" />
                                Charges Fixes
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-lg bg-white/70 backdrop-blur-sm ring-1 ring-slate-200/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-emerald-600" />
                            Solde Bancaire
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-extrabold tracking-tight ${currentBalance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            {currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-emerald-600/70 mt-1 font-medium bg-emerald-50 inline-block px-2 py-0.5 rounded-full">
                            Actualisé temps réel
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-white/70 backdrop-blur-sm ring-1 ring-slate-200/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-blue-600" />
                            Prélèvements à venir
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            {remainingFixedCosts.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-medium">Sur le mois en cours</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-white/70 backdrop-blur-sm ring-1 ring-slate-200/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-amber-600" />
                            Factures à payer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-amber-700 tracking-tight">
                            {totalUnpaidPOs.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-amber-600/70 mt-1 font-medium bg-amber-50 inline-block px-2 py-0.5 rounded-full">
                            {unpaidPOs.length} factures en attente
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp className="h-24 w-24" />
                    </div>
                    <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-emerald-100 flex items-center gap-2">
                            Est. Fin de Mois
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-extrabold tracking-tight">
                            {eomForecast.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-emerald-200 mt-1 font-medium opacity-80">
                            Projection hors CA futur
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <BalanceChart data={chartData} />
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-none shadow-xl h-full flex flex-col justify-between overflow-hidden relative rounded-3xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <TrendingUp className="h-48 w-48" />
                        </div>
                        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 h-32 w-32 bg-emerald-500/20 blur-2xl rounded-full" />
                        <CardHeader className="relative z-10">
                            <CardTitle className="text-emerald-400 flex items-center gap-2 text-sm uppercase tracking-widest font-bold">
                                <TrendingUp className="h-5 w-5" />
                                Pilotage Intelligent
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 relative z-10 pb-10">
                            <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                                <p className="text-xs text-slate-400 mb-2 uppercase font-bold tracking-tight">Alertes Trésorerie</p>
                                {unpaidPOs.length > 0 ? (
                                    <p className="text-lg font-medium leading-normal">
                                        <span className="text-amber-400 font-bold">{unpaidPOs.length} factures</span> sont en attente de réconciliation ou de paiement.
                                    </p>
                                ) : (
                                    <p className="text-lg font-medium leading-normal text-emerald-300">
                                        Tout est à jour ! Aucune facture en attente.
                                    </p>
                                )}
                            </div>
                            <div className="pt-6 border-t border-white/10">
                                <p className="text-sm text-slate-300 leading-relaxed italic opacity-80">
                                    "Le solde prévisionnel inclut vos charges fixes restantes ({remainingFixedCosts.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}) et vos dettes fournisseurs."
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="grid grid-cols-1 gap-8">
                <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden ring-1 ring-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-slate-100 bg-slate-50/30">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-900">Dernières Transactions</CardTitle>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Flux bancaires récents (crédits et débits).</p>
                        </div>
                        <Link href="/finance/history">
                            <Button variant="outline" size="sm" className="rounded-full px-6 border-slate-200 hover:bg-white hover:text-emerald-700 hover:border-emerald-200 transition-all font-medium">
                                Voir tout l'historique <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentTransactions.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50/20">
                                <div className="bg-slate-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <Wallet className="h-8 w-8 text-slate-400" />
                                </div>
                                <h3 className="text-slate-900 font-medium">Aucune donnée</h3>
                                <p className="text-slate-500 text-sm mt-1">Commencez par importer votre relevé bancaire.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {recentTransactions.map((t: any) => (
                                    <div key={t.id} className="flex items-center justify-between p-6 hover:bg-slate-50/80 transition-colors group">
                                        <div className="flex items-center gap-5">
                                            <div className={`p-4 rounded-2xl transition-all shadow-sm ${Number(t.amount) >= 0 ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:scale-105' : 'bg-red-50 text-red-600 group-hover:bg-red-100 group-hover:scale-105'}`}>
                                                {Number(t.amount) >= 0 ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-base">{t.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 border-slate-200 text-slate-500 bg-slate-50">
                                                        {t.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                                    </Badge>
                                                    {t.category && (
                                                        <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 bg-blue-50 text-blue-600 hover:bg-blue-100 border-none">
                                                            {t.category.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-lg font-black tracking-tight ${Number(t.amount) >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {Number(t.amount) > 0 ? '+' : ''}{Number(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
