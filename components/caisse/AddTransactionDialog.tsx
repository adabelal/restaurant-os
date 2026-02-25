'use client'

import { useState } from 'react'
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
import { Plus, Wallet, Calendar as CalendarIcon, ArrowUpCircle, ArrowDownCircle, Info, Tag } from "lucide-react"
import { createCashTransaction } from "@/app/caisse/actions"
import { CashTransactionType } from "@prisma/client"

interface AddTransactionDialogProps {
    categories: any[]
}

export function AddTransactionDialog({ categories }: AddTransactionDialogProps) {
    const [open, setOpen] = useState(false)
    const [type, setType] = useState<CashTransactionType>('OUT')

    async function handleSubmit(formData: FormData) {
        const amount = parseFloat(formData.get('amount') as string)
        const dateStr = formData.get('date') as string
        const description = formData.get('description') as string
        const categoryId = formData.get('categoryId') as string

        await createCashTransaction({
            date: new Date(dateStr),
            amount,
            type,
            description,
            categoryId: categoryId === 'none' ? undefined : categoryId
        })

        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all hover:scale-105">
                    <Plus className="mr-2 h-4 w-4" /> Nouvelle Transaction
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-border shadow-2xl bg-card text-card-foreground">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2 text-foreground">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Wallet className="h-4 w-4" />
                        </div>
                        Ajouter un flux de caisse
                    </DialogTitle>
                    <DialogDescription>
                        Enregistrez une entrée ou une sortie de monnaie.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex p-1 bg-muted rounded-xl mb-4">
                    <button
                        onClick={() => setType('OUT')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${type === 'OUT' ? 'bg-background shadow-sm text-rose-600' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <ArrowDownCircle className="h-4 w-4" /> Sortie
                    </button>
                    <button
                        onClick={() => setType('IN')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${type === 'IN' ? 'bg-background shadow-sm text-emerald-600' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <ArrowUpCircle className="h-4 w-4" /> Entrée
                    </button>
                </div>

                <form action={handleSubmit} className="grid gap-5 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="date">Date</Label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="date" name="date" type="date" className="pl-9" defaultValue={new Date().toISOString().split('T')[0]} required />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (Libellé)</Label>
                        <div className="relative">
                            <Info className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="description" name="description" placeholder="Ex: Course METRO, Recette midi..." className="pl-9" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Montant</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-bold">€</span>
                                <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" className="pl-8" required />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="categoryId">Catégorie</Label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                <select
                                    id="categoryId"
                                    name="categoryId"
                                    className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                >
                                    <option value="none">Aucune</option>
                                    {categories.filter(c => c.type === type).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-border">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
                        <Button type="submit" className={type === 'IN' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-rose-500 text-white hover:bg-rose-600'}>
                            Confirmer {type === 'IN' ? 'l\'entrée' : 'la sortie'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
