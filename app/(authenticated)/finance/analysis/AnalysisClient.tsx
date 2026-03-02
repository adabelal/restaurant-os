'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useState, useMemo } from 'react'

export type CategoryDataItem = {
    id: string
    name: string
    type: string
    totalAmount: number
    monthlyData: Record<string, number>
}

export function AnalysisClient({ data, months }: { data: CategoryDataItem[], months: string[] }) {
    const [filterType, setFilterType] = useState<string>('EXPENSE')

    const expenses = ['FIXED_COST', 'VARIABLE_COST', 'TAX', 'FINANCIAL', 'INVESTMENT', 'SALARY']
    const revenues = ['REVENUE']

    const filteredData = useMemo(() => {
        return data.filter(d =>
            filterType === 'EXPENSE' ? expenses.includes(d.type) : revenues.includes(d.type)
        )
    }, [data, filterType])

    const totalFiltered = filteredData.reduce((acc, d) => acc + d.totalAmount, 0)

    return (
        <div className="space-y-6">
            <Card className="shadow-sm border-border bg-card">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                    <div>
                        <CardTitle className="text-xl">Répartition par catégorie</CardTitle>
                        <CardDescription>
                            Comparaison des volumes totaux sur la période (toutes dates)
                        </CardDescription>
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="EXPENSE">Analyse des Dépenses</SelectItem>
                            <SelectItem value="REVENUE">Analyse des Recettes</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-2 mb-2 p-4 bg-muted/40 rounded-xl">
                        <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total:</span>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-indigo-500 to-indigo-700">
                            {totalFiltered.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {filteredData.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">Aucune donnée trouvée pour ce filtre.</div>
                        ) : (
                            filteredData.map(cat => {
                                const percentage = totalFiltered > 0 ? (cat.totalAmount / totalFiltered) * 100 : 0
                                return (
                                    <div key={cat.id} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-foreground">{cat.name}</span>
                                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 opacity-60 uppercase">{cat.type}</Badge>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-muted-foreground font-medium">
                                                    {cat.totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                </span>
                                                <span className="w-12 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                                    {percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredData.slice(0, 6).map(cat => (
                    <Card key={cat.id} className="shadow-sm border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold truncate" title={cat.name}>{cat.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mt-4">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">Tendance (Mois récents)</span>
                                <div className="divide-y divide-border border rounded-lg overflow-hidden">
                                    {months.slice(0, 4).map(month => (
                                        <div key={month} className="flex justify-between items-center p-2 bg-muted/20 text-sm hover:bg-muted/50 transition-colors">
                                            <span className="text-muted-foreground font-medium">{month}</span>
                                            <span className="font-semibold">{((cat.monthlyData[month] || 0)).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
