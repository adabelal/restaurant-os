
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Banknote,
    RefreshCcw,
    Calendar,
    Settings,
    Landmark,
    PieChart,
    Tags,
    Sparkles
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BalanceChart } from "@/components/finance/BalanceChart"
import { getMonthlyTimeline, getFinanceStats } from "./actions"

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
    const {
        currentBalance,
        remainingFixedCosts,
        eomForecast,
        recentTransactions,
        chartData
    } = await getFinanceStats()

    const timeline = await getMonthlyTimeline()

    // Combined indicators
    const cashBalance = chartData.length > 0 ? (chartData[chartData.length - 1].cash || 0) : 0

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] space-y-8 p-6 md:p-10 max-w-[1600px] mx-auto font-sans transition-colors duration-300">
            {/* Header Section - Elegant & Refined */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-2">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">
                        Tableau de Bord
                    </h1>
                    <p className="text-slate-500 font-medium text-base">
                        Vue d'overview de la trésorerie et des flux financiers du restaurant.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Button asChild variant="outline" className="h-11 px-5 rounded-xl border-slate-200 bg-white shadow-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 gap-2 text-sm">
                        <Link href="/finance/categorisation">
                            <Tags className="w-4 h-4 text-slate-400" />
                            Catégorisation
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-11 px-5 rounded-xl border-slate-200 bg-white shadow-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 gap-2 text-sm">
                        <Link href="/finance/analysis">
                            <PieChart className="w-4 h-4 text-slate-400" />
                            Analyse
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-11 px-5 rounded-xl border-slate-200 bg-white shadow-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 gap-2 text-sm">
                        <Link href="/finance/previsionnel">
                            <Sparkles className="w-4 h-4 text-slate-400" />
                            Prévisionnel
                        </Link>
                    </Button>
                    <Button asChild className="h-11 px-6 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-[0_4px_12px_rgba(37,99,235,0.2)] font-semibold gap-2 border-none">
                        <Link href="/finance/bank">
                            <Landmark className="w-4 h-4" />
                            Ma Banque
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Main KPIs Row - New Design Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. SOLDE BANQUE */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[24px] overflow-hidden relative group pt-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-6">
                        <CardTitle className="text-sm font-semibold text-slate-500">
                            Solde Banque
                        </CardTitle>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold text-[11px] px-2 py-0.5 rounded-full">
                            +2.4%
                        </Badge>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="text-[32px] font-bold text-[#0F172A] tracking-tight mb-4">
                            {currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[70%]" />
                        </div>
                    </CardContent>
                </Card>

                {/* 2. SOLDE CAISSE */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[24px] overflow-hidden relative pt-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-6">
                        <CardTitle className="text-sm font-semibold text-slate-500">
                            Solde Caisse
                        </CardTitle>
                        <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-none font-bold text-[11px] px-2 py-0.5 rounded-full">
                            -1.2%
                        </Badge>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="text-[32px] font-bold text-[#0F172A] tracking-tight mb-4">
                            {cashBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 w-[50%]" />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. CHARGES FIXES */}
                <Link href="/finance/charges">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[24px] overflow-hidden relative pt-2 h-full hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-6">
                            <CardTitle className="text-sm font-semibold text-slate-500">
                                Prélèvements
                            </CardTitle>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold text-[11px] px-2 py-0.5 rounded-full">
                                +0.5%
                            </Badge>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <div className="text-[32px] font-bold text-[#0F172A] tracking-tight mb-4">
                                {remainingFixedCosts.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </div>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[40%]" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* 4. FORECAST */}
                <Link href="/finance/previsionnel">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[24px] overflow-hidden relative pt-2 h-full hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-6">
                            <CardTitle className="text-sm font-semibold text-slate-500">
                                Prévision Fin de Mois
                            </CardTitle>
                            <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-none font-bold text-[11px] px-2 py-0.5 rounded-full">
                                -3.1%
                            </Badge>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <div className="text-[32px] font-bold text-[#0F172A] tracking-tight mb-4">
                                {eomForecast.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </div>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-300 w-[60%]" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Secondary Row: Chart & Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    {/* CHART */}
                    <div className="bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-[#0F172A]">
                                Évolution Trésorerie
                            </h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-[#10b981]" />
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Banque</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Caisse</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[400px]">
                            <BalanceChart data={chartData} />
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Trésorerie Consolidée</span>
                            <span className="text-2xl font-bold text-emerald-600">
                                {(currentBalance + cashBalance).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </span>
                        </div>
                    </div>

                    {/* RECENT TRANSACTIONS */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[32px] overflow-hidden">
                        <CardHeader className="px-8 py-6 border-b border-slate-50">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-[#0F172A]">Derniers Mouvements</CardTitle>
                                <Button asChild variant="ghost" size="sm" className="text-emerald-600 font-bold hover:bg-emerald-50">
                                    <Link href="/finance/transactions">Voir tout</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 py-2">
                            <div className="divide-y divide-slate-50">
                                {recentTransactions.map((t: any) => (
                                    <div key={t.id} className="flex items-center justify-between py-5 group">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-11 w-11 rounded-1.5xl flex items-center justify-center ${Number(t.amount) >= 0
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'bg-slate-50 text-slate-500'
                                                }`}>
                                                {Number(t.amount) >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#0F172A] text-sm">{t.description}</p>
                                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                    {t.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                                    {t.category && ` • ${t.category.name}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-base font-bold ${Number(t.amount) >= 0 ? 'text-emerald-600' : 'text-[#0F172A]'}`}>
                                            {Number(t.amount) > 0 ? '+' : ''}{Number(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8 lg:col-span-1">
                    {/* Monthly Timeline / Calendar */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[32px] overflow-hidden flex flex-col">
                        <CardHeader className="px-8 py-6 border-b border-slate-50">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-[#0F172A]">Échéancier</CardTitle>
                                <Button variant="ghost" size="sm" className="text-emerald-600 p-0 h-auto font-bold text-xs hover:bg-transparent">
                                    Voir tout
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 py-4">
                            {timeline.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-slate-400 text-sm font-medium italic">Aucune charge détectée</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {timeline.slice(0, 5).map((item: any) => (
                                        <div key={item.id} className={`flex items-center justify-between group ${item.isPast ? 'opacity-40 grayscale' : ''}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <Calendar className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#0F172A] text-sm leading-tight">{item.name}</p>
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">Prévu le {item.date.getDate()}/{item.date.getMonth() + 1}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-rose-500 text-sm">-{item.amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€</p>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full mt-4 h-12 rounded-2xl border-dashed border-2 border-slate-200 text-slate-400 font-bold text-sm hover:border-slate-300 hover:text-slate-600 transition-all">
                                        + Ajouter une échéance
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Expert Advice Card */}
                    <Card className="border-none shadow-none bg-emerald-50/50 rounded-[32px] p-8 space-y-4">
                        <h4 className="text-lg font-bold text-[#0F172A]">Conseil Expert</h4>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            Optimisez votre stock ce mois-ci pour réduire vos charges de 15% sur les produits frais.
                        </p>
                        <div className="h-16 w-full bg-emerald-100/50 rounded-full" />
                    </Card>
                </div>
            </div>
        </div>
    )
}
