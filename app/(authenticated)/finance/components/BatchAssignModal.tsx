'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

export type BatchTx = {
    id: string
    isCash: boolean
    description: string
    date: Date
    amount: number
    currentCategoryName: string | null
}

type BatchAssignModalProps = {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    transactions: BatchTx[]
    onConfirm: (selectedTx: BatchTx[]) => void
    isLoading?: boolean
}

export function BatchAssignModal({ isOpen, onOpenChange, transactions, onConfirm, isLoading }: BatchAssignModalProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Quand on ouvre le modal, tout est pré-coché
    useEffect(() => {
        if (isOpen && transactions.length > 0) {
            setSelectedIds(new Set(transactions.map(t => t.id)))
        }
    }, [isOpen, transactions])

    const handleToggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(transactions.map(t => t.id)))
        } else {
            setSelectedIds(new Set())
        }
    }

    const handleToggleOne = (id: string, checked: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (checked) next.add(id)
            else next.delete(id)
            return next
        })
    }

    const handleConfirm = () => {
        const selectedTx = transactions.filter(t => selectedIds.has(t.id))
        onConfirm(selectedTx)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Appliquer aux transactions similaires</DialogTitle>
                    <DialogDescription>
                        Nous avons trouvé {transactions.length} transaction(s) correspondant à cette règle ou libellé.
                        Cochez celles que vous souhaitez mettre à jour avec la nouvelle catégorie.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 py-2">
                    <div className="flex items-center gap-2 pb-3 border-b border-border">
                        <Checkbox
                            id="select-all"
                            checked={selectedIds.size === transactions.length && transactions.length > 0}
                            onCheckedChange={handleToggleAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                            Tout sélectionner
                        </label>
                    </div>

                    <ScrollArea className="h-[400px] mt-2 pr-4">
                        <div className="space-y-2">
                            {transactions.map(t => (
                                <div key={t.id} className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 items-start sm:items-center justify-between">
                                    <div className="flex items-start gap-3 flex-1 overflow-hidden">
                                        <Checkbox
                                            id={`tx-${t.id}`}
                                            checked={selectedIds.has(t.id)}
                                            onCheckedChange={(c) => handleToggleOne(t.id, c === true)}
                                            className="mt-1 sm:mt-0"
                                        />
                                        <div className="min-w-0">
                                            <label htmlFor={`tx-${t.id}`} className="text-sm font-medium truncate cursor-pointer block">
                                                {t.description}
                                            </label>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <span>{format(new Date(t.date), 'dd MMM yyyy', { locale: fr })}</span>
                                                {t.currentCategoryName ? (
                                                    <span className="bg-muted px-1.5 py-0.5 rounded text-foreground inline-flex items-center">
                                                        {t.currentCategoryName}
                                                        <span className="ml-1 opacity-50">(actuelle)</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-500/80">Non catégorisée</span>
                                                )}
                                                {t.isCash && <span className="text-rose-500 font-semibold">• Caisse</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-semibold shrink-0 flex items-center gap-1 ${t.amount >= 0 ? "text-emerald-500" : "text-slate-600"}`}>
                                        {t.amount >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                        {Math.abs(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button onClick={handleConfirm} disabled={isLoading || selectedIds.size === 0}>
                        {isLoading ? "Application..." : `Mettre à jour (${selectedIds.size})`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
