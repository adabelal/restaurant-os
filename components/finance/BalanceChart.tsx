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
    balance: number
}

export function BalanceChart({ data }: { data: DataPoint[] }) {
    // Format month for display (e.g., 2024-01 -> Jan 24)
    const formatMonth = (str: string) => {
        const [year, month] = str.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val)
    }

    return (
        <Card className="col-span-1 lg:col-span-2 border-slate-200 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 bg-white/50 pb-4">
                <CardTitle className="text-lg font-bold text-slate-800">Évolution du Solde</CardTitle>
                <CardDescription>Flux de trésorerie sur les 12 derniers mois</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="month"
                                tickFormatter={formatMonth}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(val: number) => `${Math.round(val / 1000)}k€`}
                            />
                            <Tooltip
                                formatter={(value: number) => [formatCurrency(value), 'Solde']}
                                labelFormatter={formatMonth}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    padding: '12px'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="balance"
                                stroke="#0ea5e9"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorBalance)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
