"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    Clock, Trash2, ChevronLeft, ChevronRight, Edit2, AlertCircle
} from "lucide-react"
import { addShift, deleteShift } from "@/app/rh/actions"
import { EditShiftDialog } from "@/components/rh/EditShiftDialog"
import Link from 'next/link'

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
        <Card className="border-none shadow-sm">
            <CardHeader className="border-b flex flex-row items-center justify-between">
                <CardTitle>Historique & Saisie</CardTitle>
                <div className="flex items-center gap-2">
                    <Link href={`/rh/${employee.id}?month=${prevMonth}&year=${prevYear}&tab=hours`}>
                        <Button variant="outline" size="sm" className="gap-2"><ChevronLeft className="h-4 w-4" /> Précédent</Button>
                    </Link>
                    <div className="flex flex-col items-center">
                        <Badge className="px-4 py-1 text-sm bg-primary text-primary-foreground border-none shadow-sm">{monthLabel}</Badge>
                        <span className="text-xs font-bold text-muted-foreground mt-1">Total: {totalHoursMonth.toFixed(1)}h</span>
                    </div>
                    <Link href={`/rh/${employee.id}?month=${nextMonth}&year=${nextYear}&tab=hours`}>
                        <Button variant="outline" size="sm" className="gap-2">Suivant <ChevronRight className="h-4 w-4" /></Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className={`p-6 bg-muted/30 border-b border-border relative transition-opacity ${!hasActiveContract ? 'opacity-50 pointer-events-none' : ''}`}>
                    {!hasActiveContract && (
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                            <AlertCircle className="h-3 w-3" />
                            Contrat actif requis
                        </div>
                    )}
                    <form action={handleSubmit} className="grid md:grid-cols-5 gap-4 items-end">
                        <input type="hidden" name="userId" value={employee.id} />
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Date</Label>
                            <Input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Début</Label>
                            <Input type="time" name="startTime" className="bg-background" required />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Fin</Label>
                            <Input type="time" name="endTime" className="bg-background" required />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Pause (min)</Label>
                            <Input type="number" name="breakMinutes" defaultValue="30" className="bg-background" />
                        </div>
                        <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10">
                            {isLoading ? "Ajout..." : "Ajouter"}
                        </Button>
                    </form>
                </div>
                <div className="divide-y divide-border overflow-hidden rounded-b-xl">
                    {shifts.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground italic">Aucun shift enregistré sur ce mois ({monthLabel}).</div>
                    ) : (
                        shifts.map((s) => {
                            const diff = s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0
                            const h = (diff / 1000 / 3600) - (s.breakMinutes / 60)
                            return (
                                <div key={s.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded bg-muted flex flex-col items-center justify-center text-[10px] font-bold border border-border">
                                            <span className="text-muted-foreground">{s.startTime.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()}</span>
                                            <span className="text-foreground text-lg leading-tight">{s.startTime.getDate()}</span>
                                        </div>
                                        <div>
                                            {!(employee.name.toLowerCase().includes('adam') || employee.name.toLowerCase().includes('benjamin')) ? (
                                                <>
                                                    <p className="text-sm font-semibold text-foreground">{s.startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {s.endTime?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                    <p className="text-xs text-muted-foreground">Pause: {s.breakMinutes}m • {h.toFixed(1)}h effectives</p>
                                                </>
                                            ) : (
                                                <p className="text-sm font-semibold text-foreground">Service assuré</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-foreground">{(h * Number(s.hourlyRate)).toFixed(2)} €</p>
                                            <p className="text-[10px] text-muted-foreground">{Number(s.hourlyRate).toFixed(2)} €/h</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <EditShiftDialog shift={s} userId={employee.id} />
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
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
