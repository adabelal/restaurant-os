'use client'

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
import { updateIngredient } from "@/app/stock/actions"
import { useState } from "react"
import { toast } from "sonner"
import { Pencil } from "lucide-react"

interface EditIngredientDialogProps {
    ingredient: {
        id: string
        name: string
        category: string
        currentStock: number
        minStock: number
        unit: string
        pricePerUnit: number
    }
}

export function EditIngredientDialog({ ingredient }: EditIngredientDialogProps) {
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        const res = await updateIngredient(formData)
        if (res.success) {
            toast.success(res.message)
            setOpen(false)
        } else {
            toast.error(res.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-blue-600">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Modifier l'Ingrédient</DialogTitle>
                    <DialogDescription>
                        Mettez à jour les informations de cet ingrédient.
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit} className="grid gap-4 py-4">
                    <input type="hidden" name="id" value={ingredient.id} />
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nom</Label>
                        <Input id="name" name="name" placeholder="Saumon frais" defaultValue={ingredient.name} className="col-span-3" required />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Catégorie</Label>
                        <select name="category" defaultValue={ingredient.category} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm col-span-3">
                            <option value="VIANDE">Viande / Poisson</option>
                            <option value="LEGUME">Légume / Fruit</option>
                            <option value="SEC">Épicerie Sèche</option>
                            <option value="BOISSON">Boisson</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="currentStock" className="text-right">Stock Actuel</Label>
                        <div className="col-span-3 flex gap-2">
                            <Input type="number" step="0.01" name="currentStock" defaultValue={ingredient.currentStock} placeholder="0" />
                            <select name="unit" defaultValue={ingredient.unit} className="w-24 rounded-md border border-input bg-background px-2 text-sm">
                                <option value="KG">kg</option>
                                <option value="L">Litres</option>
                                <option value="PIECE">Pièce</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="minStock" className="text-right text-red-500">Alerte à</Label>
                        <Input type="number" step="0.01" name="minStock" defaultValue={ingredient.minStock} placeholder="Ex: 5" className="col-span-3" />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">Prix Unitaire (€)</Label>
                        <Input type="number" step="0.01" name="price" defaultValue={ingredient.pricePerUnit} placeholder="0.00" className="col-span-3" />
                    </div>

                    <DialogFooter>
                        <Button type="submit">Enregistrer les modifications</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
