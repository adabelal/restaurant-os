'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createBankTransaction, updateBankTransaction } from '../actions'
import { toast } from 'sonner'
import { format } from 'date-fns'

type ManualTransactionDialogProps = {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    transaction?: any // If editing
    categories: { id: string, name: string, type: string }[]
}

export function ManualTransactionDialog({
    isOpen,
    onOpenChange,
    transaction,
    categories
}: ManualTransactionDialogProps) {
    const [date, setDate] = useState(transaction?.date ? format(new Date(transaction.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
    const [amount, setAmount] = useState(transaction?.amount?.toString() || '')
    const [description, setDescription] = useState(transaction?.description || '')
    const [categoryId, setCategoryId] = useState(transaction?.categoryId || 'none')
    const [paymentMethod, setPaymentMethod] = useState(transaction?.paymentMethod || 'CARD')
    const [thirdPartyName, setThirdPartyName] = useState(transaction?.thirdPartyName || '')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (transaction) {
            setDate(format(new Date(transaction.date), 'yyyy-MM-dd'))
            setAmount(transaction.amount.toString())
            setDescription(transaction.description)
            setCategoryId(transaction.categoryId || 'none')
            setPaymentMethod(transaction.paymentMethod || 'CARD')
            setThirdPartyName(transaction.thirdPartyName || '')
        } else {
            setDate(format(new Date(), 'yyyy-MM-dd'))
            setAmount('')
            setDescription('')
            setCategoryId('none')
            setPaymentMethod('CARD')
            setThirdPartyName('')
        }
    }, [transaction, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const data = {
            date: new Date(date),
            amount: parseFloat(amount),
            description: description.trim(),
            categoryId: categoryId === 'none' ? undefined : categoryId,
            paymentMethod,
            thirdPartyName: thirdPartyName.trim() || undefined
        }

        if (isNaN(data.amount)) {
            toast.error("Montant invalide")
            setIsLoading(false)
            return
        }

        try {
            const res = transaction
                ? await updateBankTransaction(transaction.id, data)
                : await createBankTransaction(data)

            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(transaction ? "Transaction mise à jour" : "Transaction créée")
                onOpenChange(false)
            }
        } catch (error) {
            toast.error("Une erreur est survenue")
        } finally {
            setIsLoading(false)
        }
    }

    const categoriesByType = categories.reduce((acc, cat) => {
        if (!acc[cat.type]) acc[cat.type] = []
        acc[cat.type].push(cat)
        return acc
    }, {} as Record<string, typeof categories>)

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-[32px] overflow-hidden border-none shadow-2xl p-0">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="p-8 pb-4 bg-slate-50/50">
                        <DialogTitle className="text-2xl font-black text-[#0F172A]">
                            {transaction ? 'Modifier la transaction' : 'Nouvelle transaction'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-8 pt-4 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="h-12 bg-slate-50 border-slate-100 rounded-2xl font-bold focus:ring-indigo-500/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Montant (€)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    className="h-12 bg-slate-50 border-slate-100 rounded-2xl font-bold focus:ring-indigo-500/10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Libellé / Description</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                placeholder="ex: Paiement Loyer, Facture METRO..."
                                className="h-12 bg-slate-50 border-slate-100 rounded-2xl font-bold focus:ring-indigo-500/10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="thirdParty" className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Tiers (Optionnel)</Label>
                            <Input
                                id="thirdParty"
                                value={thirdPartyName}
                                onChange={(e) => setThirdPartyName(e.target.value)}
                                placeholder="ex: EDF, METRO, PROVENCIA..."
                                className="h-12 bg-slate-50 border-slate-100 rounded-2xl font-bold focus:ring-indigo-500/10"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Méthode</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-2xl font-bold focus:ring-indigo-500/10 shadow-none">
                                        <SelectValue placeholder="Méthode" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                        <SelectItem value="CARD" className="py-2.5 rounded-xl font-medium">Carte Bancaire</SelectItem>
                                        <SelectItem value="TRANSFER" className="py-2.5 rounded-xl font-medium">Virement</SelectItem>
                                        <SelectItem value="DIRECT_DEBIT" className="py-2.5 rounded-xl font-medium">Prélèvement</SelectItem>
                                        <SelectItem value="CASH" className="py-2.5 rounded-xl font-medium">Espèces</SelectItem>
                                        <SelectItem value="OTHER" className="py-2.5 rounded-xl font-medium">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Catégorie</Label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-2xl font-bold focus:ring-indigo-500/10 shadow-none">
                                        <SelectValue placeholder="Choisir..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl max-h-[300px]">
                                        <SelectItem value="none" className="py-2.5 rounded-xl font-medium text-amber-600">Non catégorisé</SelectItem>
                                        {Object.entries(categoriesByType).map(([type, cats]) => (
                                            <div key={type} className="mt-2 first:mt-0">
                                                <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 mb-1">{type}</div>
                                                {cats.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id} className="py-2 px-3 rounded-xl font-medium text-[13px]">
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </div>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-slate-50/50 flex flex-row gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200"
                        >
                            {isLoading ? 'Enregistrement...' : (transaction ? 'Modifier' : 'Créer')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
