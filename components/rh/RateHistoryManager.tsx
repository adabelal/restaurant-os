'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Calendar, Euro } from "lucide-react"
import { toast } from "sonner"
import { updateHourlyRateHistory } from "@/app/rh/actions"

interface RateEntry {
    rate: number
    startDate: string
}

interface RateHistoryManagerProps {
    userId: string
    currentHistoryJson?: string
}

export function RateHistoryManager({ userId, currentHistoryJson }: RateHistoryManagerProps) {
    const [rates, setRates] = useState<RateEntry[]>(() => {
        try {
            return currentHistoryJson ? JSON.parse(currentHistoryJson) : []
        } catch (e) {
            return []
        }
    })
    const [newRate, setNewRate] = useState('')
    const [newDate, setNewDate] = useState('')

    const addRate = async () => {
        if (!newRate || !newDate) return
        
        const updatedRates = [...rates, { rate: parseFloat(newRate), startDate: newDate }]
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        
        setRates(updatedRates)
        setNewRate('')
        setNewDate('')

        const formData = new FormData()
        formData.append('userId', userId)
        formData.append('ratesJson', JSON.stringify(updatedRates))
        
        const res = await updateHourlyRateHistory(formData)
        if (res.success) toast.success("Historique mis à jour")
        else toast.error("Erreur mise à jour")
    }

    const removeRate = async (index: number) => {
        const updatedRates = rates.filter((_, i) => i !== index)
        setRates(updatedRates)
        
        const formData = new FormData()
        formData.append('userId', userId)
        formData.append('ratesJson', JSON.stringify(updatedRates))
        
        const res = await updateHourlyRateHistory(formData)
        if (res.success) toast.success("Historique mis à jour")
    }

    return (
        <Card className="border-border shadow-sm bg-card">
            <CardHeader className="bg-muted/20 border-b border-border">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Euro className="h-4 w-4 text-primary" />
                    Historique des Taux Horaires
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 items-end bg-muted/30 p-4 rounded-lg border border-border/50 shadow-inner">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Prochain Taux (€)</Label>
                        <Input 
                            type="number" 
                            step="0.01" 
                            value={newRate} 
                            onChange={(e) => setNewRate(e.target.value)}
                            placeholder="12.50"
                            className="bg-background"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Date d'effet</Label>
                        <Input 
                            type="date" 
                            value={newDate} 
                            onChange={(e) => setNewDate(e.target.value)}
                            className="bg-background"
                        />
                    </div>
                    <Button onClick={addRate} className="col-span-full gap-2 bg-primary text-primary-foreground">
                        <Plus className="h-4 w-4" /> Planifier ce taux
                    </Button>
                </div>

                <div className="space-y-3">
                    {rates.length === 0 ? (
                        <p className="text-center text-xs text-muted-foreground italic py-4">Aucun historique planifié. Le taux de base est utilisé.</p>
                    ) : (
                        rates.map((r, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border border-border rounded-xl bg-background shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                                        <Euro className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-foreground">{r.rate.toFixed(2)} € / h</p>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(r.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeRate(i)} className="text-muted-foreground hover:text-red-500 h-8 w-8">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
