
"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createEvent, updateEvent } from "../actions"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { CalendarIcon, Edit2, Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface Band {
    id: string
    name: string
}

interface AddEventDialogProps {
    bands: Band[]
    eventToEdit?: any // Si présent, on passe en mode édition
    trigger?: React.ReactNode
}

export function AddEventDialog({ bands, eventToEdit, trigger }: AddEventDialogProps) {
    const [open, setOpen] = useState(false)
    const [isFree, setIsFree] = useState(eventToEdit?.isFree || false)

    // Reset isFree when eventToEdit changes (for reuse)
    useEffect(() => {
        if (eventToEdit) {
            setIsFree(eventToEdit.isFree || false)
        }
    }, [eventToEdit])

    async function onSubmit(formData: FormData) {
        // Ajouter isFree explicitement car les FormData ne gèrent pas bien les checkboxes non cochées
        formData.append("isFree", String(isFree))

        const result = eventToEdit
            ? await updateEvent(formData)
            : await createEvent(formData)

        if (result && result.error) {
            toast.error(typeof result.error === 'string' ? result.error : "Erreur lors de l'enregistrement")
        } else {
            toast.success(eventToEdit ? "Concert mis à jour" : "Événement programmé")
            setOpen(false)
        }
    }

    const defaultDate = eventToEdit?.date
        ? new Date(eventToEdit.date).toISOString().split('T')[0]
        : ""

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Nouvelle Date
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{eventToEdit ? "Modifier le concert" : "Programmer un concert"}</DialogTitle>
                    <DialogDescription>
                        {eventToEdit ? "Modifiez les informations du concert sélectionné." : "Ajoutez une nouvelle date de concert au calendrier."}
                    </DialogDescription>
                </DialogHeader>
                <form action={onSubmit} className="grid gap-4 py-4">
                    {eventToEdit && <input type="hidden" name="id" value={eventToEdit.id} />}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bandId" className="text-right">
                            Groupe
                        </Label>
                        <div className="col-span-3">
                            <Select name="bandId" defaultValue={eventToEdit?.bandId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un groupe" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bands?.map((band) => (
                                        <SelectItem key={band.id} value={band.id}>
                                            {band.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                            Date
                        </Label>
                        <Input
                            type="date"
                            name="date"
                            className="col-span-3"
                            defaultValue={defaultDate}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startTime" className="text-right">
                            Heure
                        </Label>
                        <Input
                            type="time"
                            name="startTime"
                            className="col-span-3"
                            defaultValue={eventToEdit?.startTime || "20:00"}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Options</Label>
                        <div className="col-span-3 flex items-center space-x-2">
                            <Checkbox
                                id="isFree"
                                checked={isFree}
                                onCheckedChange={(checked) => setIsFree(!!checked)}
                            />
                            <Label htmlFor="isFree" className="text-sm font-medium leading-none cursor-pointer">
                                Concert Gratuit (pas de cachet)
                            </Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                            Cachet (€)
                        </Label>
                        <Input
                            type="number"
                            step="0.01"
                            name="amount"
                            className="col-span-3"
                            defaultValue={eventToEdit?.amount || 0}
                            disabled={isFree}
                            required={!isFree}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="paymentMethod" className="text-right">
                            Paiement
                        </Label>
                        <div className="col-span-3">
                            <Select name="paymentMethod" defaultValue={eventToEdit?.paymentMethod || "TRANSFER"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Moyen de paiement" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TRANSFER">Virement</SelectItem>
                                    <SelectItem value="CASH">Espèces</SelectItem>
                                    <SelectItem value="CHECK">Chèque</SelectItem>
                                    <SelectItem value="GUSO">GUSO (Intermittent)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="invoiceStatus" className="text-right">
                            Facture
                        </Label>
                        <div className="col-span-3">
                            <Select name="invoiceStatus" defaultValue={eventToEdit?.invoiceStatus || "PENDING"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Statut facture" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">À recevoir</SelectItem>
                                    <SelectItem value="RECEIVED">Reçue</SelectItem>
                                    <SelectItem value="PAID">Payée</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                            Statut
                        </Label>
                        <div className="col-span-3">
                            <Select name="status" defaultValue={eventToEdit?.status || "SCHEDULED"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="État du concert" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SCHEDULED">Confirmé</SelectItem>
                                    <SelectItem value="TENTATIVE">Option</SelectItem>
                                    <SelectItem value="COMPLETED">Terminé</SelectItem>
                                    <SelectItem value="CANCELLED">Annulé</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">
                            Notes
                        </Label>
                        <Textarea
                            name="notes"
                            placeholder="Détails techniques, repas staff..."
                            className="col-span-3"
                            defaultValue={eventToEdit?.notes || ""}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit">{eventToEdit ? "Enregistrer les modifications" : "Enregistrer"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
