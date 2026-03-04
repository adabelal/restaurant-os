'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    TrendingUp, TrendingDown, Target, Wallet, ArrowUpRight,
    ArrowDownRight, AlertTriangle, CheckCircle2, Zap, Activity,
    ShieldCheck, Clock, BarChart2, ChevronRight, AlertCircle
} from "lucide-react"
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, ReferenceLine, Legend
} from 'recharts'
import { ForecastData } from "./actions"

interface ForecastClientProps { data: ForecastData }

type Scenario = 'pessimiste' | 'realiste' | 'optimiste'

const SCENARIO_MULTIPLIERS: Record<Scenario, { revenue: number; expenses: number; label: string; color: string }> = {
    pessimiste: { revenue: 0.80, expenses: 1.10, label: 'Pessimiste -20%', color: '#f43f5e' },
    realiste: { revenue: 1.00, expenses: 1.00, label: 'Réaliste (Base)', color: '#6366f1' },
    optimiste: { revenue: 1.20, expenses: 0.95, label: 'Optimiste +20%', color: '#10b981' },
}

const fmt = (val: number, short = false) => {
    if (short && Math.abs(val) >= 1000) {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
            .format(val / 1000).replace(/\s?€/, 'k€')
    }
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val)
}

const pct = (val: number) => `${(val * 100).toFixed(1)}%`

function HealthGauge({ score, label }: { score: number; label: string }) {
    const color = score >= 85 ? '#10b981' : score >= 65 ? '#22c55e' : score >= 45 ? '#f59e0b' : score >= 25 ? '#f97316' : '#f43f5e'
    const circumference = 2 * Math.PI * 54
    const strokeDash = (score / 100) * circumference

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative w-36 h-36">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="12" />
                    <circle
                        cx="60" cy="60" r="54" fill="none"
                        stroke={color} strokeWidth="12"
                        strokeDasharray={`${strokeDash} ${circumference}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)', filter: `drop-shadow(0 0 8px ${color}80)` }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white" style={{ color }}>{score}</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">/100</span>
                </div>
            </div>
            <div className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest" style={{ backgroundColor: `${color}20`, color }}>
                {label}
            </div>
        </div>
    )
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-[#0f172a] border border-slate-700/50 p-4 rounded-2xl shadow-2xl min-w-[180px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center gap-4 text-xs mb-1.5">
                    <span className="font-bold text-slate-400">{p.name}</span>
                    <span className="font-black" style={{ color: p.color }}>{fmt(p.value)}</span>
                </div>
            ))}
        </div>
    )
}

export default function ForecastClient({ data }: ForecastClientProps) {
    const [scenario, setScenario] = useState<Scenario>('realiste')

    const {
        monthlyAverageRevenue, monthlyAverageExpenses,
        avgFixedCosts, avgVariableCosts,
        breakEvenPoint, grossMarginPercentage,
        expectedNetResult, currentBalance, projectedEndOfMonthBalance,
        currentDayOfMonth, totalDaysInMonth, monthProgressPct,
        dailyBurnRate, daysUntilZero,
        healthScore, healthLabel,
        waterfallData, monthlyBreakdown,
        categories, historicalMonths, officialBaselines
    } = data

    const sc = SCENARIO_MULTIPLIERS[scenario]

    const scenarioRevenue = monthlyAverageRevenue * sc.revenue
    const scenarioExpenses = monthlyAverageExpenses * sc.expenses
    const scenarioNet = scenarioRevenue - scenarioExpenses
    const scenarioBreakEven = grossMarginPercentage > 0
        ? (avgFixedCosts * sc.expenses) / (grossMarginPercentage * sc.revenue)
        : 0

    const revenueCategories = categories.filter(c => c.type === 'REVENUE')
    const expenseCategories = categories.filter(c => c.type !== 'REVENUE')

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ═══════════════════════════════════════════════════════════
                SECTION 1 — SCORE DE SANTÉ + ALERTES CRITIQUES
            ═══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Health Score */}
                <Card className="border-none shadow-2xl bg-gradient-to-br from-[#0d1526] to-[#0a0f1e] rounded-3xl overflow-hidden ring-1 ring-white/5 lg:row-span-1">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5" /> Score de Santé Financière
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <HealthGauge score={healthScore} label={healthLabel} />
                        <div className="grid grid-cols-2 gap-3 w-full mt-4">
                            {[
                                { label: 'Marge Brute', value: pct(grossMarginPercentage), ok: grossMarginPercentage >= 0.5 },
                                { label: 'vs Break-even', value: `${((monthlyAverageRevenue / Math.max(1, breakEvenPoint)) * 100).toFixed(0)}%`, ok: monthlyAverageRevenue >= breakEvenPoint },
                                { label: 'Résultat Net', value: pct(expectedNetResult / Math.max(1, monthlyAverageRevenue)), ok: expectedNetResult >= 0 },
                                { label: 'Tréso (mois)', value: `${(currentBalance / Math.max(1, monthlyAverageExpenses)).toFixed(1)}m`, ok: currentBalance >= monthlyAverageExpenses },
                            ].map(kpi => (
                                <div key={kpi.label} className={`p-2.5 rounded-xl text-center flex flex-col gap-1 ${kpi.ok ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                                    <span className={`text-sm font-black ${kpi.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{kpi.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Treasury Alert + Day Progress */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Day-of-month Progress */}
                    <Card className="border-none shadow-xl bg-gradient-to-br from-[#0d1526] to-[#0a0f1e] rounded-3xl overflow-hidden ring-1 ring-white/5">
                        <CardContent className="p-6 flex flex-col gap-4 h-full justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Avancement du Mois</span>
                                </div>
                                <p className="text-4xl font-black text-white mt-2">{monthProgressPct}<span className="text-xl text-slate-500">%</span></p>
                                <p className="text-xs font-bold text-slate-500 mt-1">Jour {currentDayOfMonth} sur {totalDaysInMonth}</p>
                            </div>
                            <div>
                                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000 relative"
                                        style={{ width: `${monthProgressPct}%` }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 bg-indigo-300 rounded-full shadow-[0_0_12px_#818cf8] -mr-2.5" />
                                    </div>
                                </div>
                                <div className="flex justify-between mt-2 text-[9px] font-black text-slate-600 uppercase">
                                    <span>1er</span>
                                    <span>{totalDaysInMonth}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Treasury Alert */}
                    <Card className={`border-none shadow-xl rounded-3xl overflow-hidden ring-1 ${daysUntilZero !== null && daysUntilZero < 60 ? 'bg-gradient-to-br from-rose-950/60 to-[#0a0f1e] ring-rose-500/20' : 'bg-gradient-to-br from-[#0d1526] to-[#0a0f1e] ring-white/5'}`}>
                        <CardContent className="p-6 flex flex-col gap-4 h-full justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    {daysUntilZero !== null && daysUntilZero < 60
                                        ? <AlertTriangle className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                                        : <Zap className="h-3.5 w-3.5 text-amber-400" />
                                    }
                                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${daysUntilZero !== null && daysUntilZero < 60 ? 'text-rose-400' : 'text-amber-400'}`}>Alerte Trésorerie</span>
                                </div>
                                {daysUntilZero !== null ? (
                                    <>
                                        <p className="text-4xl font-black text-white mt-2">
                                            {daysUntilZero} <span className="text-xl text-slate-500">jours</span>
                                        </p>
                                        <p className="text-xs font-bold text-slate-500 mt-1">Avant tréso à zéro au rythme actuel</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-2xl font-black text-emerald-400 mt-2">Flux Positif</p>
                                        <p className="text-xs font-bold text-slate-500 mt-1">Votre cash flow mensuel est excédentaire</p>
                                    </>
                                )}
                            </div>
                            <div className="p-3 bg-slate-800/50 rounded-xl flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-500 uppercase">Flux Journalier Moyen</span>
                                <span className={`text-sm font-black ${dailyBurnRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {dailyBurnRate >= 0 ? '+' : ''}{fmt(dailyBurnRate)} / jour
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Current Balance + Projection */}
                    <Card className="border-none shadow-xl bg-gradient-to-br from-[#0d1526] to-[#0a0f1e] rounded-3xl overflow-hidden ring-1 ring-white/5 sm:col-span-2">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Solde Bancaire Actuel</p>
                                    <p className="text-3xl font-black text-white mt-2">{fmt(currentBalance)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Projection Fin de Mois</p>
                                    <p className={`text-3xl font-black mt-2 ${projectedEndOfMonthBalance >= currentBalance ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {fmt(projectedEndOfMonthBalance)}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-600 mb-1.5">
                                        <span>Solde actuel</span>
                                        <span className={projectedEndOfMonthBalance >= currentBalance ? 'text-emerald-500' : 'text-rose-500'}>
                                            {projectedEndOfMonthBalance >= currentBalance ? '▲' : '▼'} {fmt(Math.abs(projectedEndOfMonthBalance - currentBalance))} prévu
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${projectedEndOfMonthBalance >= currentBalance ? 'bg-gradient-to-r from-emerald-700 to-emerald-400' : 'bg-gradient-to-r from-rose-700 to-rose-400'}`}
                                            style={{ width: `${Math.min(100, (Math.min(currentBalance, projectedEndOfMonthBalance) / Math.max(1, Math.max(currentBalance, projectedEndOfMonthBalance))) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 2 — MOTEUR DE SCÉNARIOS
            ═══════════════════════════════════════════════════════════ */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Moteur de Scénarios</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Simulez les impacts sur votre rentabilité</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl ring-1 ring-white/5">
                        {(Object.entries(SCENARIO_MULTIPLIERS) as [Scenario, typeof SCENARIO_MULTIPLIERS.realiste][]).map(([key, s]) => (
                            <button
                                key={key}
                                onClick={() => setScenario(key)}
                                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                                style={scenario === key ? { backgroundColor: s.color + '25', color: s.color, boxShadow: `0 0 20px ${s.color}30` } : { color: '#475569' }}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        { label: 'CA Projeté', value: scenarioRevenue, base: monthlyAverageRevenue, icon: <TrendingUp className="h-4 w-4" />, positive: true },
                        { label: 'Charges Projetées', value: scenarioExpenses, base: monthlyAverageExpenses, icon: <TrendingDown className="h-4 w-4" />, positive: false },
                        { label: 'Résultat Net', value: scenarioNet, base: expectedNetResult, icon: <Activity className="h-4 w-4" />, positive: scenarioNet >= 0 },
                        { label: 'Seuil Rentabilité', value: scenarioBreakEven, base: breakEvenPoint, icon: <Target className="h-4 w-4" />, positive: scenarioRevenue >= scenarioBreakEven },
                    ].map((kpi, i) => {
                        const diff = kpi.value - kpi.base
                        const color = SCENARIO_MULTIPLIERS[scenario].color
                        return (
                            <Card key={i} className="border-none shadow-xl bg-[#0d1526] rounded-3xl overflow-hidden ring-1 ring-white/5 relative group overflow-hidden">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${color}10, transparent 70%)` }} />
                                <CardContent className="p-6 relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</span>
                                        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20', color }}>
                                            {kpi.icon}
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black text-white mb-3">{fmt(kpi.value)}</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${diff >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                                            {diff >= 0 ? '+' : ''}{fmt(diff)}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-600">vs base</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 3 — GRAPHIQUES
            ═══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Time-Series Area Chart (3/5) */}
                <Card className="lg:col-span-3 border-none shadow-xl bg-[#0d1526] rounded-3xl overflow-hidden ring-1 ring-white/5">
                    <CardHeader className="px-6 pt-6 pb-4">
                        <CardTitle className="text-base font-black text-white flex items-center gap-2">
                            <BarChart2 className="h-4 w-4 text-indigo-400" /> Évolution sur 6 Mois
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CA vs Charges vs Résultat Net</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 pb-6">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyBreakdown} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} tickFormatter={v => fmt(v, true)} width={60} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="revenue" name="CA" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradRev)" dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
                                    <Area type="monotone" dataKey="expenses" name="Charges" stroke="#f43f5e" strokeWidth={2} fill="url(#gradExp)" dot={false} activeDot={{ r: 5, fill: '#f43f5e' }} />
                                    <Area type="monotone" dataKey="net" name="Net" stroke="#10b981" strokeWidth={2} fill="url(#gradNet)" dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Waterfall Chart (2/5) */}
                <Card className="lg:col-span-2 border-none shadow-xl bg-[#0d1526] rounded-3xl overflow-hidden ring-1 ring-white/5">
                    <CardHeader className="px-6 pt-6 pb-4">
                        <CardTitle className="text-base font-black text-white flex items-center gap-2">
                            <Activity className="h-4 w-4 text-amber-400" /> Cascade de Résultat
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Du CA au résultat net mensuel</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 pb-6">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-30} textAnchor="end" tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }} height={60} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} tickFormatter={v => fmt(Math.abs(v), true)} width={60} />
                                    <Tooltip content={({ active, payload }: any) => {
                                        if (!active || !payload?.length) return null
                                        const d = payload[0].payload
                                        const color = d.type === 'revenue' ? '#6366f1' : d.type === 'result' ? '#10b981' : '#f43f5e'
                                        return (
                                            <div className="bg-[#0f172a] border border-slate-700/50 p-4 rounded-2xl shadow-2xl">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{d.name}</p>
                                                <p className="text-xl font-black" style={{ color }}>{fmt(d.value)}</p>
                                            </div>
                                        )
                                    }} />
                                    <ReferenceLine y={0} stroke="#334155" />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
                                        {waterfallData.map((entry, i) => (
                                            <Cell key={i} fill={
                                                entry.type === 'revenue' ? '#6366f1' :
                                                    entry.type === 'result' ? (entry.value >= 0 ? '#10b981' : '#f43f5e') :
                                                        '#f43f5e'
                                            } />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 4 — BILANS COMPTABLES OFFICIELS
            ═══════════════════════════════════════════════════════════ */}
            <div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-1">Bilans Comptables</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Exercices certifiés — données expert comptable</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {officialBaselines.map((b, idx) => {
                        const primeCost = ((b.costOfSales + b.payroll) / b.ca) * 100
                        const isPrimeCostOk = primeCost <= 65
                        const ebeMargin = (b.ebe / b.ca * 100)
                        const monthlyCA = b.ca / b.months

                        return (
                            <Card key={idx} className="border-none shadow-xl bg-[#0d1526] rounded-3xl overflow-hidden ring-1 ring-white/5 group hover:ring-indigo-500/30 transition-all duration-300">
                                <CardHeader className="px-6 py-5 border-b border-slate-800 flex flex-row items-center gap-4 space-y-0">
                                    <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-[0_0_20px_#6366f140] group-hover:scale-105 transition-transform">{b.year}</div>
                                    <div>
                                        <CardTitle className="text-base font-black text-white">Exercice {b.year}</CardTitle>
                                        <CardDescription className="text-[10px] font-black tracking-widest uppercase text-slate-500">{b.months} mois • BIC</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: "Chiffre d'Affaires", value: fmt(b.ca), sub: `${fmt(monthlyCA)} / mois`, color: 'text-white' },
                                            { label: 'EBE', value: fmt(b.ebe), sub: `${ebeMargin.toFixed(1)}% du CA`, color: b.ebe >= 0 ? 'text-emerald-400' : 'text-rose-400' },
                                            { label: 'Résultat Net', value: fmt(b.netResult), sub: `${(b.netResult / b.ca * 100).toFixed(1)}% du CA`, color: b.netResult >= 0 ? 'text-emerald-400' : 'text-rose-400' },
                                            { label: 'Prime Cost', value: `${primeCost.toFixed(1)}%`, sub: isPrimeCostOk ? '✓ Sous contrôle' : '⚠ Au-dessus de 65%', color: isPrimeCostOk ? 'text-emerald-400' : 'text-rose-400' },
                                        ].map(item => (
                                            <div key={item.label} className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                                                <p className={`text-lg font-black mt-1 ${item.color}`}>{item.value}</p>
                                                <p className="text-[9px] font-bold text-slate-600 mt-0.5">{item.sub}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 5 — DÉTAIL PAR CATÉGORIE
            ═══════════════════════════════════════════════════════════ */}
            <Card className="border-none shadow-xl bg-[#0d1526] rounded-3xl overflow-hidden ring-1 ring-white/5">
                <CardHeader className="px-8 py-6 border-b border-slate-800">
                    <CardTitle className="text-xl font-black text-white">Détail par Catégorie</CardTitle>
                    <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">Analyse granulaire • Moyenne {historicalMonths.join(', ')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/50">
                                    <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-10"></th>
                                    <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Catégorie</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Moy. Hist.</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">% du CA</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Ce mois</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Reste prévu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {categories.sort((a, b) => Math.abs(b.avgMonthly) - Math.abs(a.avgMonthly)).map(cat => {
                                    const isExpense = cat.type !== 'REVENUE'
                                    const isGood = isExpense
                                        ? Math.abs(cat.currentMonth) <= Math.abs(cat.avgMonthly)
                                        : Math.abs(cat.currentMonth) >= Math.abs(cat.avgMonthly)
                                    const progress = Math.min(100, (Math.abs(cat.currentMonth) / Math.max(1, Math.abs(cat.avgMonthly))) * 100)
                                    const caPercent = (Math.abs(cat.avgMonthly) / Math.max(1, monthlyAverageRevenue) * 100).toFixed(1)

                                    return (
                                        <tr key={cat.categoryId} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className={`h-2 w-2 rounded-full ${isGood ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
                                            </td>
                                            <td className="px-4 py-5">
                                                <p className="text-sm font-black text-white">{cat.name}</p>
                                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{cat.type}</span>
                                            </td>
                                            <td className="px-4 py-5 text-right">
                                                <span className="text-sm font-bold text-slate-400">{fmt(cat.avgMonthly)}</span>
                                            </td>
                                            <td className="px-4 py-5 text-right">
                                                <span className="text-[10px] font-black text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{caPercent}%</span>
                                            </td>
                                            <td className="px-4 py-5 text-right">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className={`text-sm font-black ${cat.currentMonth > 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                                                        {fmt(cat.currentMonth)}
                                                    </span>
                                                    <div className="h-1 w-20 bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${isGood ? 'bg-indigo-500' : 'bg-rose-500'}`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 text-right">
                                                <span className={`text-sm font-black ${cat.remainingPlanned === 0 ? 'text-slate-600' : cat.remainingPlanned > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {cat.remainingPlanned > 0 ? '+' : ''}{fmt(cat.remainingPlanned)}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-8 py-4 border-t border-slate-800 flex items-center justify-between">
                        <p className="text-[9px] font-bold text-slate-600 uppercase italic">* Reste prévu = Moyenne historique − Réalisé ce mois</p>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /><span className="text-[9px] font-black text-slate-500 uppercase">Sous objectif</span></div>
                            <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-rose-500" /><span className="text-[9px] font-black text-slate-500 uppercase">Dépassement</span></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
