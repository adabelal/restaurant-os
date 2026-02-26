'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, PieChart, TrendingUp, Wallet, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"

interface CaisseStatsProps {
    transactions: any[]
}

export function CaisseStats({ transactions }: CaisseStatsProps) {
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

    const filteredTransactions = transactions.filter(t => {
        const d = new Date(t.date)
        return isWithinInterval(d, {
            start: new Date(startDate),
            end: new Date(endDate)
        })
    })

    // Group by category
    const categoryTotals: Record<string, { total: number, type: string, name: string }> = {}

    filteredTransactions.forEach(t => {
        const catName = t.category?.name || 'Sans catégorie'
        const catId = t.categoryId || 'none'
        const key = `${catId}-${t.type}`

        if (!categoryTotals[key]) {
            categoryTotals[key] = { total: 0, type: t.type, name: catName }
        }
        categoryTotals[key].total += Number(t.amount)
    })

    const sortedCats = Object.values(categoryTotals).sort((a, b) => b.total - a.total)
    const maxTotal = Math.max(...sortedCats.map(c => c.total), 1)

    const totalIn = filteredTransactions.filter(t => t.type === 'IN').reduce((acc, t) => acc + Number(t.amount), 0)
    const totalOut = filteredTransactions.filter(t => t.type === 'OUT').reduce((acc, t) => acc + Number(t.amount), 0)

    return (
        <div className="space-y-8">
            {/* Period Selector */}
            <Card className="border-none shadow-sm bg-muted/30">
                <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-bold text-foreground">Période d'analyse :</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-[160px] bg-background"
                            />
                            <span className="text-muted-foreground">au</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-[160px] bg-background"
                            />
                        </div>
                        <div className="hidden md:block flex-1" />
                        <div className="flex gap-4">
                            <div className="text-center md:text-right">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Entrées</p>
                                <p className="text-sm font-bold text-emerald-600">+{totalIn.toLocaleString('fr-FR')} €</p>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Sorties</p>
                                <p className="text-sm font-bold text-rose-600">-{totalOut.toLocaleString('fr-FR')} €</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-500" /> Répartition par Catégorie
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {sortedCats.map((cat, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${cat.type === 'IN' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        {cat.name}
                                    </span>
                                    <span className="font-bold">{cat.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${cat.type === 'IN' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                        style={{ width: `${(cat.total / maxTotal) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {sortedCats.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                Aucune donnée sur cette période.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-blue-500" /> Résumé Global
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-8">
                        <div className="relative h-48 w-48 rounded-full border-[12px] border-muted flex items-center justify-center">
                            <div className="text-center">
                                <Wallet className="h-8 w-8 text-blue-500 mx-auto mb-1" />
                                <div className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Flux Net</div>
                                <div className={`text-xl font-black ${(totalIn - totalOut) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {(totalIn - totalOut).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 w-full space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Entrées</span>
                                <span className="font-bold text-emerald-600">+{totalIn.toLocaleString('fr-FR')} €</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Sorties</span>
                                <span className="font-bold text-rose-600">-{totalOut.toLocaleString('fr-FR')} €</span>
                            </div>
                            <div className="h-px bg-border my-2" />
                            <div className="flex justify-between text-sm font-bold">
                                <span>Solde Période</span>
                                <span className={(totalIn - totalOut) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                    {(totalIn - totalOut).toLocaleString('fr-FR')} €
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
