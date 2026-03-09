'use client'

import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface DataPoint {
    month: string
    bank: number
    cash: number
    total: number
}

export function BalanceChart({ data }: { data: DataPoint[] }) {
    // Format month for display (e.g., 2024-01 -> Jan 24)
    const formatMonth = (str: string) => {
        if (!str) return ""
        const [year, month] = str.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val)
    }

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorBank" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0 0" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                        dataKey="month"
                        tickFormatter={formatMonth}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                        dy={15}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                        tickFormatter={(val: number) => `${Math.round(val / 1000)}k`}
                    />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-white/90 backdrop-blur-md p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-2xl border border-slate-100 min-w-[200px]">
                                        <p className="text-xs font-bold text-slate-400 mb-3 border-b border-slate-50 pb-2 uppercase tracking-widest">
                                            {formatMonth(String(label))}
                                        </p>
                                        <div className="space-y-2.5">
                                            {payload.map((entry: any) => (
                                                <div key={entry.name} className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{entry.name}</span>
                                                    </div>
                                                    <span className="text-sm font-black text-[#0F172A]">{formatCurrency(entry.value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Area
                        type="monotone"
                        name="Banque"
                        dataKey="bank"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorBank)"
                    />
                    <Area
                        type="monotone"
                        name="Caisse"
                        dataKey="cash"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorCash)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
