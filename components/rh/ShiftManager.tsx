"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    Clock, Trash2, ChevronLeft, ChevronRight, Edit2, AlertCircle,
    ChefHat, UtensilsCrossed, Wine, Droplets, ShieldCheck
} from "lucide-react"
import { addShift, deleteShift } from "@/app/rh/actions"
import { EditShiftDialog } from "@/components/rh/EditShiftDialog"
import Link from 'next/link'
import { POSITIONS } from "./GlobalShiftCalendar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface ShiftManagerProps {
    employee: any
    shifts: any[]
    monthLabel: string
    prevMonth: number
    prevYear: number
    nextMonth: number
    nextYear: number
}

export function ShiftManager({
    employee,
    shifts,
    monthLabel,
    prevMonth,
    prevYear,
    nextMonth,
    nextYear
}: ShiftManagerProps) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)

        const dateStr = formData.get("date") as string
        const startTimeStr = formData.get("startTime") as string
        const endTimeStr = formData.get("endTime") as string

        if (dateStr && startTimeStr && endTimeStr) {
            let start = new Date(`${dateStr}T${startTimeStr}:00`)
            let end = new Date(`${dateStr}T${endTimeStr}:00`)
            if (end <= start) end.setDate(end.getDate() + 1)

            formData.set("isoStart", start.toISOString())
            formData.set("isoEnd", end.toISOString())
        }

        try {
            const res = await addShift(formData) as any
            if (res.success) {
                toast.success("Shift ajouté avec succès.")
                // Le revalidatePath dans l'action rafraîchira la page
            } else {
                toast.error(res.message || res.error || "Erreur lors de l'ajout.")
            }
        } catch (e) {
            toast.error("Une erreur est survenue.")
        } finally {
            setIsLoading(false)
        }
    }

    const hasActiveContract = employee.documents?.some((doc: any) => {
        if (doc.type !== 'CONTRACT') return false
        if (!doc.year) return true
        const now = new Date()
        if (doc.year < now.getFullYear()) return false
        if (doc.year === now.getFullYear() && doc.month && doc.month < now.getMonth() + 1) return false
        return true
    }) ?? false

    const totalHoursMonth = shifts.reduce((acc, s) => {
        const diff = s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0
        return acc + Math.max(0, (diff / 1000 / 3600) - ((s.breakMinutes || 0) / 60))
    }, 0)

    return (
        <Card className="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
            <CardHeader className="border-b bg-muted/20 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-lg font-bold">Historique & Saisie</CardTitle>
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                        <Link href={`/rh/${employee.id}?month=${prevMonth}&year=${prevYear}&tab=hours`}>
                            <Button variant="outline" size="icon" aria-label="Mois précédent" className="h-9 w-9 rounded-xl active:scale-95"><ChevronLeft className="h-4 w-4" /></Button>
                        </Link>
                        <div className="flex flex-col items-center flex-1 sm:flex-none">
                            <Badge className="px-4 py-1 text-xs font-black uppercase tracking-wider bg-primary text-white border-none shadow-sm rounded-lg">{monthLabel}</Badge>
                            <span className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-tighter">Total: {totalHoursMonth.toFixed(1)}h</span>
                        </div>
                        <Link href={`/rh/${employee.id}?month=${nextMonth}&year=${nextYear}&tab=hours`}>
                            <Button variant="outline" size="icon" aria-label="Mois suivant" className="h-9 w-9 rounded-xl active:scale-95"><ChevronRight className="h-4 w-4" /></Button>
                        </Link>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className={`p-4 sm:p-6 bg-primary/5 border-b border-border/50 relative transition-opacity ${!hasActiveContract ? 'opacity-50 pointer-events-none' : ''}`}>
                    {!hasActiveContract && (
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 z-10">
                            <AlertCircle className="h-3 w-3" />
                            Contrat requis
                        </div>
                    )}
                    <form action={handleSubmit} className="grid grid-cols-2 sm:grid-cols-5 gap-4 items-end">
                        <input type="hidden" name="userId" value={employee.id} />
                        <div className="space-y-1.5 col-span-2 sm:col-span-1">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">Date</Label>
                            <Input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-11 bg-background border-border/50 rounded-xl font-bold" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">Début</Label>
                            <Input type="time" name="startTime" className="h-11 bg-background border-border/50 rounded-xl font-bold" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">Fin</Label>
                            <Input type="time" name="endTime" className="h-11 bg-background border-border/50 rounded-xl font-bold" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">Pause (min)</Label>
                            <Input type="number" name="breakMinutes" defaultValue="30" step={10} min={0} className="h-11 bg-background border-border/50 rounded-xl font-bold" />
                        </div>
                        <div className="space-y-1.5 col-span-2 sm:col-span-1">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">Poste</Label>
                            <select
                                name="position"
                                className="flex h-11 w-full items-center justify-between rounded-xl border border-border/50 bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                defaultValue=""
                            >
                                <option value="">-(Optionnel)-</option>
                                {POSITIONS.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                        <Button type="submit" disabled={isLoading} className="col-span-2 sm:col-span-5 w-full bg-primary text-white hover:bg-primary/90 h-11 font-black uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20">
                            {isLoading ? "Enregistrement..." : "Ajouter ce shift"}
                        </Button>
                    </form>
                </div>

                <div className="divide-y divide-border/20 overflow-hidden rounded-b-2xl">
                    {shifts.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground italic font-medium">Aucun shift enregistré sur ce mois ({monthLabel}).</div>
                    ) : (
                        shifts.map((s, i) => {
                            const diff = s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0
                            const h = (diff / 1000 / 3600) - (s.breakMinutes / 60)
                            const isSpecial = employee.name.toLowerCase().includes('adam') || employee.name.toLowerCase().includes('benjamin')

                            return (
                                <div key={s.id} className={`flex items-center justify-between p-4 sm:p-5 hover:bg-primary/[0.02] transition-colors group ${i % 2 === 0 ? 'bg-card' : 'bg-muted/[0.05]'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-muted flex flex-col items-center justify-center text-[10px] font-black border border-border/50 shadow-sm group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                                            <span className="text-muted-foreground opacity-60 leading-none mb-0.5">{s.startTime.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase().replace('.', '')}</span>
                                            <span className="text-primary text-lg leading-none">{s.startTime.getDate()}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black text-foreground">
                                                    {isSpecial
                                                        ? "Service assuré"
                                                        : `${s.startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${s.endTime?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                                                    }
                                                </p>
                                                {s.position && (() => {
                                                    const pos: any = POSITIONS.find((p: any) => p.id === s.position)
                                                    if (pos) {
                                                        const Icon = pos.icon
                                                        return <Badge variant="outline" className="h-5 px-1.5 border-primary/20 bg-primary/5 text-primary rounded-lg" title={pos.label}><Icon className="h-3 w-3" /></Badge>
                                                    }
                                                    return null
                                                })()}
                                            </div>
                                            {!isSpecial && (
                                                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-tighter mt-0.5">
                                                    Pause: {s.breakMinutes}m • <span className="text-primary/70">{h.toFixed(1)}h effectives</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 sm:gap-6">
                                        <div className="text-right hidden xs:block">
                                            <p className="text-sm font-black text-foreground">{(h * Number(s.hourlyRate)).toFixed(2)} €</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mt-0.5">{Number(s.hourlyRate).toFixed(2)} €/h</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <EditShiftDialog shift={s} userId={employee.id} isManager={isSpecial} />
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="size-9 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                                                onClick={async () => {
                                                    if (confirm("Supprimer ce shift ?")) {
                                                        const res = await deleteShift(s.id, employee.id) as any
                                                        if (res.success) toast.success("Shift supprimé")
                                                        else toast.error("Erreur")
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
