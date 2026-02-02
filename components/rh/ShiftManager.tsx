"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
    Clock, Trash2, ChevronLeft, ChevronRight, Edit2 
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
        try {
            const res = await addShift(formData)
            if (res.success) {
                toast.success("Shift ajouté avec succès.")
                // Le revalidatePath dans l'action rafraîchira la page
            } else {
                toast.error(res.message || "Erreur lors de l'ajout.")
            }
        } catch (e) {
            toast.error("Une erreur est survenue.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="border-b flex flex-row items-center justify-between">
                <CardTitle>Historique & Saisie</CardTitle>
                <div className="flex items-center gap-2">
                    <Link href={`/rh/${employee.id}?month=${prevMonth}&year=${prevYear}&tab=hours`}>
                        <Button variant="outline" size="sm" className="gap-2"><ChevronLeft className="h-4 w-4" /> Précédent</Button>
                    </Link>
                    <Badge className="px-4 py-1 text-sm bg-slate-900 border-none">{monthLabel}</Badge>
                    <Link href={`/rh/${employee.id}?month=${nextMonth}&year=${nextYear}&tab=hours`}>
                        <Button variant="outline" size="sm" className="gap-2">Suivant <ChevronRight className="h-4 w-4" /></Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="p-6 bg-slate-50/50 border-b">
                    <form action={handleSubmit} className="grid md:grid-cols-5 gap-4 items-end">
                        <input type="hidden" name="userId" value={employee.id} />
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Date</Label>
                            <Input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Début</Label>
                            <Input type="time" name="startTime" required />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Fin</Label>
                            <Input type="time" name="endTime" required />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Pause (min)</Label>
                            <Input type="number" name="breakMinutes" defaultValue="30" />
                        </div>
                        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 h-10">
                            {isLoading ? "Ajout..." : "Ajouter"}
                        </Button>
                    </form>
                </div>
                <div className="divide-y overflow-hidden rounded-b-xl">
                    {shifts.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 italic">Aucun shift enregistré sur ce mois ({monthLabel}).</div>
                    ) : (
                        shifts.map((s) => {
                            const diff = s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0
                            const h = (diff / 1000 / 3600) - (s.breakMinutes / 60)
                            return (
                                <div key={s.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded bg-slate-100 flex flex-col items-center justify-center text-[10px] font-bold">
                                            <span className="text-slate-400">{s.startTime.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()}</span>
                                            <span className="text-slate-900 text-lg leading-tight">{s.startTime.getDate()}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{s.startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {s.endTime?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                                            <p className="text-xs text-slate-500">Pause: {s.breakMinutes}m • {h.toFixed(1)}h effectives</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <p className="text-sm font-bold">{(h * Number(s.hourlyRate)).toFixed(2)} €</p>
                                            <p className="text-[10px] text-slate-400">{Number(s.hourlyRate).toFixed(2)} €/h</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <EditShiftDialog shift={s} userId={employee.id} />
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 text-slate-300 hover:text-red-600"
                                                onClick={async () => {
                                                    if(confirm("Supprimer ce shift ?")) {
                                                        const res = await deleteShift(s.id, employee.id)
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
