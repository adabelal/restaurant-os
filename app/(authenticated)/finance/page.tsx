
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
    Settings
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BalanceChart } from "@/components/finance/BalanceChart"
import { ImportBankCsvDialog } from "@/components/finance/ImportBankCsvDialog"
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
        <div className="flex flex-col min-h-screen bg-background space-y-8 p-8 max-w-7xl mx-auto font-sans transition-colors duration-300">
            {/* Header Section - Clean & Professional */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                        Tableau de Bord Financier
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        Vue d'ensemble de la trésorerie et des flux.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ImportBankCsvDialog />
                    <Button asChild variant="outline" size="icon" className="h-10 w-10 rounded-full border-border hover:bg-muted hover:text-foreground transition-colors shadow-sm">
                        <Link href="/finance/maintenance/bank" title="Maintenance & Imports">
                            <span className="sr-only">Paramètres</span>
                            <Settings className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Main KPIs Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. SOLDE BANQUE */}
                <Card className="border border-border shadow-sm bg-card rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Solde Banque
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            Disponible réel
                        </p>
                    </CardContent>
                </Card>

                {/* 2. SOLDE CAISSE */}
                <Card className="border border-border shadow-sm bg-card rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Solde Caisse
                        </CardTitle>
                        <Banknote className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {cashBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            Dernier arrêté
                        </p>
                    </CardContent>
                </Card>

                {/* 3. CHARGES FIXES (Clickable) */}
                <Link href="/finance/charges" className="group">
                    <Card className="border border-border shadow-sm bg-card rounded-xl overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all h-full cursor-pointer relative">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="h-4 w-4 text-indigo-400" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                Prélèvements
                            </CardTitle>
                            <RefreshCcw className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                                {remainingFixedCosts.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                                Restant ce mois
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                {/* 4. FORECAST */}
                <Card className="border border-emerald-100 dark:border-emerald-900/50 shadow-sm bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-emerald-700/70 dark:text-emerald-400/70 uppercase tracking-wider">
                            Prévision Fin de Mois
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                            {eomForecast.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-emerald-600/60 dark:text-emerald-400/60 mt-1 font-medium">
                            Projection hors CA futur
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Row: Chart & Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* CHART */}
                    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-500" />
                            Évolution Trésorerie
                        </h3>
                        <div className="dark:invert dark:hue-rotate-180">
                            <BalanceChart data={chartData} />
                        </div>
                    </div>

                    {/* RECENT TRANSACTIONS */}
                    <Card className="border border-border shadow-sm bg-card rounded-xl overflow-hidden">
                        <CardHeader className="border-b border-border bg-muted/30 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">Derniers Mouvements</CardTitle>
                                <Badge variant="outline" className="font-normal text-muted-foreground bg-card">Banque</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {recentTransactions.map((t: any) => (
                                    <div key={t.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${Number(t.amount) >= 0
                                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                {Number(t.amount) >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground text-sm">{t.description}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-muted-foreground">
                                                        {t.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                                    </span>
                                                    {t.category && (
                                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-muted text-muted-foreground hover:bg-muted/80 font-normal">
                                                            {t.category.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-bold ${Number(t.amount) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                                            {Number(t.amount) > 0 ? '+' : ''}{Number(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Monthly Timeline / Calendar */}
                    <Card className="border border-border shadow-sm bg-card rounded-xl overflow-hidden flex flex-col h-full">
                        <CardHeader className="bg-muted/30 border-b border-border px-6 py-4">
                            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-indigo-500" />
                                Échéancier du Mois
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-y-auto max-h-[600px] custom-scrollbar">
                            {timeline.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="bg-muted h-12 w-12 rounded-full mx-auto mb-3 flex items-center justify-center">
                                        <RefreshCcw className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground text-sm font-medium italic">Aucune charge détectée</p>
                                    <Button asChild variant="link" className="mt-2 text-indigo-600 dark:text-indigo-400 h-auto p-0">
                                        <Link href="/finance/charges">Ajouter une charge</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {timeline.map((item: any) => (
                                        <div key={item.id} className={`p-4 flex items-center justify-between group hover:bg-muted/50 transition-colors ${item.isPast ? 'opacity-50 grayscale' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-lg flex flex-col items-center justify-center font-bold text-xs ring-1 ring-inset ${item.isPast
                                                        ? 'bg-muted text-muted-foreground ring-border'
                                                        : 'bg-card text-indigo-600 dark:text-indigo-400 ring-indigo-100 dark:ring-indigo-900 shadow-sm'
                                                    }`}>
                                                    <span className="uppercase text-[8px] opacity-70">{item.date.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                                                    <span className="text-sm">{item.date.getDate()}</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{item.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">{item.category}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-foreground text-xs sm:text-sm">-{item.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
