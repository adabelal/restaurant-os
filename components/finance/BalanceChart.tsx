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
        <Card className="col-span-1 lg:col-span-2 border-none shadow-xl overflow-hidden bg-white/70 backdrop-blur-md ring-1 ring-slate-200/50 rounded-3xl">
            <CardHeader className="border-b border-slate-100/50 bg-slate-50/30 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black text-slate-800 tracking-tight">Trésorerie Consolidée</CardTitle>
                        <CardDescription className="font-medium text-slate-500">Évolution combinée Banque + Caisse</CardDescription>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase">Banque</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-amber-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase">Caisse</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-8">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorBank" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.05} />
                                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="month"
                                tickFormatter={formatMonth}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                dy={15}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                tickFormatter={(val: number) => `${Math.round(val / 1000)}k`}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white p-4 shadow-2xl rounded-2xl border border-slate-100 min-w-[200px]">
                                                <p className="text-sm font-black text-slate-900 mb-3 border-b pb-2 uppercase tracking-wider">
                                                    {formatMonth(String(label))}
                                                </p>
                                                <div className="space-y-2">
                                                    {payload.map((entry: any) => (
                                                        <div key={entry.name} className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                <span className="text-xs font-bold text-slate-500 uppercase">{entry.name}</span>
                                                            </div>
                                                            <span className="text-sm font-black text-slate-900">{formatCurrency(entry.value)}</span>
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
                                name="Total"
                                dataKey="total"
                                stroke="#334155"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                            />
                            <Area
                                type="monotone"
                                name="Banque"
                                dataKey="bank"
                                stroke="#10b981"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorBank)"
                            />
                            <Area
                                type="monotone"
                                name="Caisse"
                                dataKey="cash"
                                stroke="#f59e0b"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorCash)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
