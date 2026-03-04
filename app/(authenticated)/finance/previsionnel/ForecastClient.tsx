'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    TrendingUp,
    TrendingDown,
    Target,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    PieChart,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Minus
} from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ComposedChart,
    Line
} from 'recharts'
import { ForecastData, ForecastCategoryInfo } from "./actions"

interface ForecastClientProps {
    data: ForecastData
}

export default function ForecastClient({ data }: ForecastClientProps) {
    const {
        monthlyAverageRevenue,
        monthlyAverageExpenses,
        expectedNetResult,
        currentBalance,
        projectedEndOfMonthBalance,
        categories,
        historicalMonths
    } = data

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val)
    }

    const revenueCategories = categories.filter(c => c.type === 'REVENUE')
    const expenseCategories = categories.filter(c => c.type !== 'REVENUE')

    // Prepare data for the comparison chart
    const chartData = categories
        .filter(c => Math.abs(c.avgMonthly) > 100 || Math.abs(c.currentMonth) > 100) // Filter out small ones for chart
        .map(c => ({
            name: c.name,
            historique: Math.abs(c.avgMonthly),
            actuel: Math.abs(c.currentMonth),
            type: c.type
        }))
        .sort((a, b) => b.historique - a.historique)

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-md rounded-3xl overflow-hidden ring-1 ring-white/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-widest flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            CA Mensuel Moyen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                            {formatCurrency(monthlyAverageRevenue)}
                        </div>
                        <p className="text-xs font-semibold text-slate-500">
                            Basé sur les {historicalMonths.length} derniers mois
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-gradient-to-br from-rose-500/10 to-orange-500/10 backdrop-blur-md rounded-3xl overflow-hidden ring-1 ring-white/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-rose-600/70 dark:text-rose-400/70 uppercase tracking-widest flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" />
                            Charges Moyennes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                            {formatCurrency(monthlyAverageExpenses)}
                        </div>
                        <p className="text-xs font-semibold text-slate-500">
                            Projection dépenses mensuelles
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-md rounded-3xl overflow-hidden ring-1 ring-white/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Résultat Net Projeté
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-black mb-1 ${expectedNetResult >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(expectedNetResult)}
                        </div>
                        <p className="text-xs font-semibold text-slate-500">
                            Profit opérationnel estimé
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-2xl bg-slate-900 dark:bg-slate-800 rounded-3xl overflow-hidden ring-1 ring-white/10 group">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-amber-500" />
                            Trésorerie Fin de Mois
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white mb-1 group-hover:scale-105 transition-transform origin-left duration-300">
                            {formatCurrency(projectedEndOfMonthBalance)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                            <Badge variant="outline" className={`text-[10px] font-bold uppercase transition-colors ${projectedEndOfMonthBalance >= currentBalance ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                {projectedEndOfMonthBalance >= currentBalance ? '+' : '-'} {formatCurrency(Math.abs(projectedEndOfMonthBalance - currentBalance))}
                            </Badge>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">vs. Aujourd'hui</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Chart Card */}
                <Card className="lg:col-span-2 border-none shadow-xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl overflow-hidden ring-1 ring-slate-200/50 dark:ring-white/10">
                    <CardHeader className="px-8 pt-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Comparatif Historique vs Actuel</CardTitle>
                                <CardDescription className="font-semibold text-slate-500 mt-1 uppercase text-xs tracking-wider">Moyenne ({historicalMonths.join(', ')})</CardDescription>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Moyenne</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-indigo-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Ce Mois</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[400px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        interval={0}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                        height={100}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                        tickFormatter={(val) => `${val}€`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        content={({ active, payload }: any) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload
                                                return (
                                                    <div className="bg-slate-900 border border-slate-800 p-4 shadow-2xl rounded-2xl min-w-[200px]">
                                                        <p className="text-xs font-black text-white mb-2 uppercase tracking-widest">{data.name}</p>
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-400 font-bold uppercase">Moyenne</span>
                                                                <span className="text-white font-black">{formatCurrency(data.historique)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-400 font-bold uppercase">Ce Mois</span>
                                                                <span className="text-indigo-400 font-black">{formatCurrency(data.actuel)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Bar dataKey="historique" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={20} />
                                    <Bar dataKey="actuel" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recap Summary Sidebar */}
                <Card className="border-none shadow-xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl overflow-hidden ring-1 ring-slate-200/50 dark:ring-white/10 h-full">
                    <CardHeader className="px-6 py-6 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-indigo-500" />
                            Projection Globale
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trésorerie Actuelle</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(currentBalance)}</p>
                                </div>
                                <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center">
                                    <ArrowUpRight className="h-5 w-5 text-indigo-500" />
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recettes Restantes Estimation</p>
                                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                        + {formatCurrency(Math.max(0, monthlyAverageRevenue - Math.abs(revenueCategories.reduce((s, c) => s + c.currentMonth, 0))))}
                                    </p>
                                </div>
                                <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center">
                                    <Target className="h-5 w-5 text-emerald-500" />
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dépenses Restantes Estimation</p>
                                    <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                                        - {formatCurrency(Math.max(0, monthlyAverageExpenses - Math.abs(expenseCategories.reduce((s, c) => s + c.currentMonth, 0))))}
                                    </p>
                                </div>
                                <div className="h-10 w-10 bg-rose-50 dark:bg-rose-950/50 rounded-xl flex items-center justify-center">
                                    <ArrowDownRight className="h-5 w-5 text-rose-500" />
                                </div>
                            </div>

                            <div className="pt-4 bg-slate-950 -mx-6 -mb-6 p-6">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Projection Fin de Mois</p>
                                <p className="text-3xl font-black text-white mt-2 font-mono">{formatCurrency(projectedEndOfMonthBalance)}</p>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full mt-6 overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(100, (currentBalance / Math.max(1, projectedEndOfMonthBalance)) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-[9px] font-bold text-slate-500 mt-2 text-right uppercase italic opacity-60">Estimation indicative</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Categories Table */}
            <Card className="border-none shadow-xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl overflow-hidden ring-1 ring-slate-200/50 dark:ring-white/10">
                <CardHeader className="px-8 py-8 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Détail par Catégorie</CardTitle>
                    <CardDescription className="font-bold text-slate-500 uppercase text-xs tracking-widest">Analyse granulaire des flux mensuels</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-12">Statut</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Historique (Moy.)</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aujourd'hui</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Reste à venir*</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {categories.sort((a, b) => b.avgMonthly - a.avgMonthly).map((cat) => {
                                    const isExpense = cat.type !== 'REVENUE'
                                    const isGood = isExpense
                                        ? Math.abs(cat.currentMonth) <= Math.abs(cat.avgMonthly)
                                        : Math.abs(cat.currentMonth) >= Math.abs(cat.avgMonthly)

                                    const progress = Math.min(100, (Math.abs(cat.currentMonth) / Math.max(1, Math.abs(cat.avgMonthly))) * 100)

                                    return (
                                        <tr key={cat.categoryId} className="hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-colors group">
                                            <td className="px-8 py-6 text-center">
                                                {isGood ? (
                                                    <div className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                                                ) : (
                                                    <div className="inline-flex h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]" />
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{cat.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 w-fit px-1.5 py-0.5 rounded-md mt-1 italic">{cat.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-sm font-bold text-slate-500">{formatCurrency(cat.avgMonthly)}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className={`text-sm font-black ${cat.currentMonth > 0 ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                                                        {formatCurrency(cat.currentMonth)}
                                                    </span>
                                                    <div className="h-1 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${isGood ? 'bg-indigo-500' : 'bg-rose-500'} rounded-full transition-all duration-1000`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Badge variant="secondary" className={`text-[10px] font-black font-mono px-3 py-1 rounded-full ${cat.remainingPlanned === 0 ? 'bg-slate-100 text-slate-400' : cat.remainingPlanned > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                                    {cat.remainingPlanned > 0 ? '+' : ''}{formatCurrency(cat.remainingPlanned)}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all group-hoverScale-110">
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">
                            * Reste à venir = (Moyenne Historique) - (Actuel Réel)
                        </p>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-3 w-3 text-rose-500" />
                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Alerte D dépassement</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sous contrôle</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
