'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Calendar, Euro, Sparkles, Info } from "lucide-react"
import { toast } from "sonner"
import { updateHourlyRateHistory } from "@/app/rh/actions"
import { SMIC_HISTORY, getApplicableRate } from "@/lib/rh-utils"

interface RateEntry {
    rate: number
    startDate: string
}

interface RateHistoryManagerProps {
    userId: string
    currentHistoryJson?: string
    selectedMonth?: number
    selectedYear?: number
}

export function RateHistoryManager({ userId, currentHistoryJson, selectedMonth = new Date().getMonth(), selectedYear = new Date().getFullYear() }: RateHistoryManagerProps) {
    const [rates, setRates] = useState<RateEntry[]>(() => {
        try {
            return currentHistoryJson ? JSON.parse(currentHistoryJson) : []
        } catch (e) {
            return []
        }
    })
    const [newRate, setNewRate] = useState('')
    const [newDate, setNewDate] = useState('')

    const currentApplicableRate = getApplicableRate(JSON.stringify(rates), 0, selectedMonth, selectedYear)

    const saveHistory = async (newRates: RateEntry[]) => {
        const formData = new FormData()
        formData.append('userId', userId)
        formData.append('ratesJson', JSON.stringify(newRates))

        const res = await updateHourlyRateHistory(formData) as any
        if (res && res.success) {
            toast.success("Historique mis à jour")
            return true
        }
        toast.error("Erreur mise à jour")
        return false
    }

    const applySmicPresets = async () => {
        const smicRates = SMIC_HISTORY.map(s => ({ rate: s.rate, startDate: s.startDate }))
        // Fusionner avec l'existant en évitant les doublons de date
        const existingDates = new Set(rates.map(r => r.startDate))
        const combined = [...rates]
        smicRates.forEach(s => {
            if (!existingDates.has(s.startDate)) combined.push(s)
        })

        const sorted = combined.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        setRates(sorted)
        await saveHistory(sorted)
    }

    const addRate = async () => {
        if (!newRate || !newDate) return
        const updatedRates = [...rates, { rate: parseFloat(newRate), startDate: newDate }]
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        setRates(updatedRates)
        setNewRate('')
        setNewDate('')
        await saveHistory(updatedRates)
    }

    const removeRate = async (index: number) => {
        const updatedRates = rates.filter((_, i) => i !== index)
        setRates(updatedRates)
        await saveHistory(updatedRates)
    }

    return (
        <Card className="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border py-4 px-4 sm:px-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                    <Euro className="h-4 w-4 text-primary" />
                    Historique des Taux
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-4 sm:px-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end bg-primary/5 p-4 rounded-xl border border-primary/10 shadow-sm transition-all focus-within:shadow-md">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">Prochain Taux (€)</Label>
                        <div className="relative">
                            <Euro className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="number"
                                step="0.01"
                                value={newRate}
                                onChange={(e) => setNewRate(e.target.value)}
                                placeholder="12.50"
                                className="pl-10 h-11 bg-background border-border/50 rounded-xl font-bold"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">Date d'effet</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="pl-10 h-11 bg-background border-border/50 rounded-xl font-bold"
                            />
                        </div>
                    </div>
                    <Button onClick={addRate} className="col-span-1 sm:col-span-full gap-2 bg-primary text-white h-11 font-black uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 mt-2">
                        <Plus className="h-4 w-4" /> Planifier ce taux
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Raccourcis rapides (SMIC)</Label>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={applySmicPresets} className="gap-2 rounded-lg border-emerald-200 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-50 text-[10px] font-black uppercase tracking-tighter h-8">
                                <Sparkles className="h-3 w-3" /> Appliquer SMIC Historique
                            </Button>
                        </div>
                    </div>
                    {rates.length === 0 ? (
                        <p className="text-center text-xs text-muted-foreground italic py-12 font-medium">Aucun historique planifié. Le taux de base est utilisé.</p>
                    ) : (
                        rates.map((r, i) => {
                            const isCurrentlyActive = r.rate === currentApplicableRate
                            return (
                                <div key={i} className={`flex items-center justify-between p-4 border rounded-2xl bg-card shadow-sm hover:shadow-md transition-all group ${isCurrentlyActive ? 'border-primary ring-1 ring-primary/20' : 'border-border/40'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`size-11 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 ${isCurrentlyActive ? 'bg-primary text-white border-primary/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                                            <Euro className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black text-foreground">{r.rate.toFixed(2)} € / h</p>
                                                {isCurrentlyActive && (
                                                    <span className="text-[8px] bg-primary text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter flex items-center gap-0.5">
                                                        <Info className="h-2 w-2" /> Actif ce mois
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-black uppercase tracking-tight mt-0.5">
                                                <Calendar className="h-3 w-3 text-primary/50" />
                                                {new Date(r.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removeRate(i)} className="text-muted-foreground hover:text-red-500 hover:bg-red-50 size-9 rounded-xl active:scale-90 transition-all">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
