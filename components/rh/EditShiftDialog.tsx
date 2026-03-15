'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil } from "lucide-react"
import { updateShift } from "@/app/rh/actions"
import { toast } from "sonner"
import { POSITIONS } from "./GlobalShiftCalendar"
import { ShieldCheck } from "lucide-react"

interface EditShiftDialogProps {
    shift: {
        id: string
        startTime: Date
        endTime: Date | null
        breakMinutes: number
        position?: string | null
    }
    userId: string
    isManager?: boolean
}

export function EditShiftDialog({ shift, userId, isManager = false }: EditShiftDialogProps) {
    const [open, setOpen] = useState(false)

    // Format date and times for input defaults
    const dateStr = new Date(shift.startTime).toISOString().split('T')[0]
    const startTimeStr = new Date(shift.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ':')
    const endTimeStr = shift.endTime
        ? new Date(shift.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ':')
        : ""

    async function handleSubmit(formData: FormData) {
        const dateStrForm = formData.get("date") as string || dateStr
        const startTimeStrForm = formData.get("startTime") as string || startTimeStr
        const endTimeStrForm = formData.get("endTime") as string || (endTimeStr || "23:30")

        if (dateStrForm && startTimeStrForm && endTimeStrForm) {
            let start = new Date(`${dateStrForm}T${startTimeStrForm}:00`)
            let end = new Date(`${dateStrForm}T${endTimeStrForm}:00`)
            if (end <= start) end.setDate(end.getDate() + 1)

            formData.set("isoStart", start.toISOString())
            formData.set("isoEnd", end.toISOString())
        }

        const res = await updateShift(formData) as any
        if (res.success) {
            toast.success(res.message || "Shift mis à jour avec succès.")
            setOpen(false)
        } else {
            toast.error(res.message || res.error || "Erreur lors de la mise à jour du shift.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Modifier le shift</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <input type="hidden" name="shiftId" value={shift.id} />
                    <input type="hidden" name="userId" value={userId} />

                    {!isManager ? (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" name="date" type="date" defaultValue={dateStr} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="startTime">Début</Label>
                                    <Input id="startTime" name="startTime" type="time" defaultValue={startTimeStr} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="endTime">Fin</Label>
                                    <Input id="endTime" name="endTime" type="time" defaultValue={endTimeStr} required />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="breakMinutes">Pause (minutes)</Label>
                                <Input id="breakMinutes" name="breakMinutes" type="number" defaultValue={shift.breakMinutes} step={10} min={0} className="bg-background" />
                            </div>
                        </>
                    ) : (
                        <div className="py-2 text-center space-y-2">
                            <ShieldCheck className="w-10 h-10 text-primary/20 mx-auto" />
                            <p className="text-sm font-bold text-muted-foreground">Les options horaires sont masquées pour les gérants.</p>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="position">Poste (optionnel)</Label>
                        <select
                            id="position"
                            name="position"
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            defaultValue={shift.position || ""}
                        >
                            <option value="">-- Sans poste spécifique --</option>
                            {POSITIONS.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    <Button type="submit" className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">Enregistrer les modifications</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
