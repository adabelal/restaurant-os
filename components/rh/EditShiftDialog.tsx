'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil } from "lucide-react"
import { updateShift } from "@/app/rh/actions"
import { toast } from "sonner"

interface EditShiftDialogProps {
    shift: {
        id: string
        startTime: Date
        endTime: Date | null
        breakMinutes: number
    }
    userId: string
}

export function EditShiftDialog({ shift, userId }: EditShiftDialogProps) {
    const [open, setOpen] = useState(false)

    // Format date and times for input defaults
    const dateStr = new Date(shift.startTime).toISOString().split('T')[0]
    const startTimeStr = new Date(shift.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ':')
    const endTimeStr = shift.endTime
        ? new Date(shift.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ':')
        : ""

    async function handleSubmit(formData: FormData) {
        const res = await updateShift(formData)
        if (res.success) {
            toast.success(res.message || "Shift mis à jour avec succès.")
            setOpen(false)
        } else {
            toast.error(res.message || "Erreur lors de la mise à jour du shift.")
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
                        <Input id="breakMinutes" name="breakMinutes" type="number" defaultValue={shift.breakMinutes} className="bg-background" />
                    </div>

                    <Button type="submit" className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">Enregistrer les modifications</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
