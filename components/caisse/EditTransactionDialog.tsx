'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { updateCashTransaction } from "@/app/caisse/actions"
import { toast } from "sonner"
import { format } from "date-fns"

interface EditTransactionDialogProps {
    transaction: any
    categories: any[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditTransactionDialog({ transaction, categories, open, onOpenChange }: EditTransactionDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        date: '',
        description: '',
        amount: '',
        categoryId: '',
        type: ''
    })

    useEffect(() => {
        if (transaction) {
            setFormData({
                date: format(new Date(transaction.date), 'yyyy-MM-dd'),
                description: transaction.description || '',
                amount: String(transaction.amount),
                categoryId: transaction.categoryId || 'none',
                type: transaction.type
            })
        }
    }, [transaction])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await updateCashTransaction(transaction.id, {
                date: new Date(formData.date),
                description: formData.description,
                amount: parseFloat(formData.amount),
                categoryId: formData.categoryId === 'none' ? undefined : formData.categoryId,
                type: formData.type as any
            })
            toast.success("Transaction mise à jour")
            onOpenChange(false)
        } catch (error) {
            toast.error("Erreur lors de la mise à jour")
        } finally {
            setLoading(false)
        }
    }

    if (!transaction) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Modifier la Transaction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val: string) => setFormData({ ...formData, type: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="IN">Entrée</SelectItem>
                                <SelectItem value="OUT">Sorties</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ex: Facture Metro"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Montant (€)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Catégorie</Label>
                        <Select
                            value={formData.categoryId}
                            onValueChange={(val: string) => setFormData({ ...formData, categoryId: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choisir une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sans catégorie</SelectItem>
                                {categories
                                    .filter(c => c.type === formData.type)
                                    .map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
