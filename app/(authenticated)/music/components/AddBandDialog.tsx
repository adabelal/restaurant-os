
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
import { createBand } from "../actions"
import { useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"

export function AddBandDialog() {
    const [open, setOpen] = useState(false)

    async function onSubmit(formData: FormData) {
        const result = await createBand(formData)

        if (result.error) {
            toast.error(typeof result.error === 'string' ? result.error : "Erreur de validation")
        } else {
            toast.success("Groupe ajouté avec succès")
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau Groupe
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ajouter un groupe</DialogTitle>
                    <DialogDescription>
                        Créez une fiche pour un nouveau groupe ou artiste.
                    </DialogDescription>
                </DialogHeader>
                <form action={onSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nom
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Ex: Les Zicos du Dimanche"
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="genre" className="text-right">
                            Style
                        </Label>
                        <Input
                            id="genre"
                            name="genre"
                            placeholder="Ex: Jazz Manouche"
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contact" className="text-right">
                            Contact
                        </Label>
                        <Input
                            id="contact"
                            name="contact"
                            placeholder="Ex: jean@mail.com / 06..."
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
