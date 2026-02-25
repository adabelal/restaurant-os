
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
import { createEvent } from "../actions"
import { useState } from "react"
import { toast } from "sonner"
import { CalendarIcon, Plus } from "lucide-react"

interface Band {
    id: string
    name: string
}

export function AddEventDialog({ bands }: { bands: Band[] }) {
    const [open, setOpen] = useState(false)

    async function onSubmit(formData: FormData) {
        const result = await createEvent(formData)
        if (result && result.error) {
            toast.error("Erreur lors de la création")
        } else {
            toast.success("Événement programmé")
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Nouvelle Date
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Programmer un concert</DialogTitle>
                    <DialogDescription>
                        Ajoutez une nouvelle date de concert au calendrier.
                    </DialogDescription>
                </DialogHeader>
                <form action={onSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bandId" className="text-right">
                            Groupe
                        </Label>
                        <div className="col-span-3">
                            <Select name="bandId" required>
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
                            defaultValue="20:00"
                        />
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
                            required
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="paymentMethod" className="text-right">
                            Paiement
                        </Label>
                        <div className="col-span-3">
                            <Select name="paymentMethod" defaultValue="TRANSFER">
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
                            <Select name="invoiceStatus" defaultValue="PENDING">
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
                            <Select name="status" defaultValue="SCHEDULED">
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
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit">Enregistrer</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
