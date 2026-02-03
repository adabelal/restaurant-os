'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Plus } from "lucide-react"

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
import { addFixedCost, createFinanceCategory } from "@/app/(authenticated)/finance/actions"
import { useToast } from "@/components/ui/use-toast"

type Category = {
    id: string
    name: string
    type: string
}

export function AddFixedCostDialog({ initialCategories }: { initialCategories: Category[] }) {
    const [open, setOpen] = useState(false)
    const [categories, setCategories] = useState<Category[]>(initialCategories)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)
    const { toast } = useToast()

    const { register, handleSubmit, reset, setValue } = useForm({
        defaultValues: {
            name: "",
            amount: "",
            dayOfMonth: "",
            frequency: "MONTHLY",
            categoryId: ""
        }
    })

    const onSubmit = async (data: any) => {
        try {
            let categoryId = data.categoryId

            if (isCreatingCategory && newCategoryName) {
                const newCat = await createFinanceCategory(newCategoryName, 'FIXED_COST')
                if (newCat.success && newCat.data) {
                    setCategories([...categories, newCat.data])
                    categoryId = newCat.data.id
                    setIsCreatingCategory(false)
                    setNewCategoryName("")
                } else {
                    toast({
                        variant: "destructive",
                        title: "Erreur",
                        description: "Impossible de créer la catégorie.",
                    })
                    return
                }
            }

            if (!categoryId) {
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Veuillez sélectionner une catégorie.",
                })
                return
            }

            const result = await addFixedCost({
                name: data.name,
                amount: parseFloat(data.amount),
                dayOfMonth: parseInt(data.dayOfMonth),
                frequency: data.frequency as 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
                categoryId: categoryId
            })

            if (result.success) {
                toast({
                    title: "Succès",
                    description: "La charge fixe a été ajoutée.",
                })
                setOpen(false)
                reset()
                setIsCreatingCategory(false)
            } else {
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Une erreur est survenue lors de l'ajout.",
                })
            }
        } catch (error) {
            console.error(error)
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Erreur inattendue.",
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Ajouter une charge
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Ajouter une charge fixe</DialogTitle>
                        <DialogDescription>
                            Configurez un prélèvement récurrent (Loyer, Assurance, etc.) pour le prévisionnel.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nom
                            </Label>
                            <Input
                                id="name"
                                placeholder="Ex: Loyer Local"
                                className="col-span-3"
                                {...register("name", { required: true })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Montant
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="1200.00"
                                className="col-span-3"
                                {...register("amount", { required: true, min: 0 })}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dayOfMonth" className="text-right">
                                Jour du mois
                            </Label>
                            <Input
                                id="dayOfMonth"
                                type="number"
                                min="1"
                                max="31"
                                placeholder="5"
                                className="col-span-3"
                                {...register("dayOfMonth", { required: true })}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="frequency" className="text-right">
                                Fréquence
                            </Label>
                            <div className="col-span-3">
                                <Select onValueChange={(val) => setValue("frequency", val)} defaultValue="MONTHLY">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Mensuel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MONTHLY">Mensuel</SelectItem>
                                        <SelectItem value="QUARTERLY">Trimestriel</SelectItem>
                                        <SelectItem value="YEARLY">Annuel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Catégorie</Label>
                            <div className="col-span-3 flex flex-col gap-2">
                                {!isCreatingCategory ? (
                                    <Select onValueChange={(val) => {
                                        if (val === "new") {
                                            setIsCreatingCategory(true)
                                            setValue("categoryId", "")
                                        } else {
                                            setValue("categoryId", val)
                                        }
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="new" className="text-blue-600 font-semibold">
                                                + Nouvelle catégorie
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Nom nouvelle catégorie"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                        />
                                        <Button type="button" variant="ghost" onClick={() => setIsCreatingCategory(false)}>X</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Enregistrer</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
