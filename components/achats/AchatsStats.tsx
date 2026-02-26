"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Euro, TrendingDown, AlertTriangle, FileCheck } from "lucide-react"

interface AchatsStatsProps {
    totalAmount: number
    alertCount: number
}

export function AchatsStats({ totalAmount, alertCount }: AchatsStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Dépenses du Mois</p>
                        <h2 className="text-3xl font-bold text-slate-800 mt-2">
                            {totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        </h2>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
                        <Euro className="h-6 w-6 text-indigo-600" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Alertes Prix</p>
                        <h2 className="text-3xl font-bold text-rose-600 mt-2">{alertCount}</h2>
                        <p className="text-xs text-rose-500 font-medium">Variations anormales détectées</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center animate-pulse">
                        <AlertTriangle className="h-6 w-6 text-rose-600" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Marge Moyenne (Estimée)</p>
                        <h2 className="text-3xl font-bold text-emerald-600 mt-2">72%</h2>
                        <p className="text-xs text-emerald-500 font-medium">+1.2% vs mois dernier</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
                        <TrendingDown className="h-6 w-6 text-emerald-600 rotate-180" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
