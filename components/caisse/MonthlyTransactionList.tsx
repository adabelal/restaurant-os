'use client'

import React, { useState } from 'react'
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit2, ListFilter, Trash2, ArrowUpRight, ArrowDownRight, Banknote } from "lucide-react"

import { EditTransactionDialog } from "./EditTransactionDialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteCashTransaction } from "@/app/caisse/actions"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { assignCashTransactionCategory, findSimilarTransactions, applyCategoryToMultipleTx } from "@/app/(authenticated)/finance/actions"
import { BatchAssignModal, BatchTx } from "@/app/(authenticated)/finance/components/BatchAssignModal"


export function MonthlyTransactionList({ transactions, categories }: { transactions: any[], categories: any[] }) {
    const [sortBy, setSortBy] = useState<'date' | 'createdAt'>('date')
    const [editingTransaction, setEditingTransaction] = useState<any>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
    const [isSyncing, setIsSyncing] = useState(false)

    const [modalOpen, setModalOpen] = useState(false)
    const [modalTxs, setModalTxs] = useState<BatchTx[]>([])
    const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null)

    const handleAssign = async (transactionId: string, categoryId: string) => {
        setLoadingIds(prev => new Set(prev).add(transactionId))
        try {
            const res = await assignCashTransactionCategory(transactionId, categoryId, false)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success("Catégorie assignée.")

                const similars = await findSimilarTransactions(transactionId)
                if (similars && 'data' in similars && similars.data && 'data' in similars.data) {
                    const similarList = similars.data.data as BatchTx[];
                    if (similarList.length > 0) {
                        setModalTxs(similarList)
                        setPendingCategoryId(categoryId)
                        setModalOpen(true)
                    }
                }
            }
        } catch (e) {
            toast.error("Erreur de réseau.")
        }
        setLoadingIds(prev => {
            const next = new Set(prev)
            next.delete(transactionId)
            return next
        })
    }

    const handleModalConfirm = async (selectedTx: BatchTx[]) => {
        if (!pendingCategoryId || selectedTx.length === 0) {
            setModalOpen(false)
            return
        }

        setIsSyncing(true)
        try {
            const res = await applyCategoryToMultipleTx(selectedTx.map(t => ({ id: t.id, isCash: t.isCash })), pendingCategoryId)
            if (res && 'data' in res && res.data && 'success' in (res.data as any)) {
                toast.success(`Catégorie appliquée à ${selectedTx.length} transaction(s).`)
                setModalOpen(false)
            } else if (res && 'error' in res) {
                toast.error(res.error || "Erreur, impossible d'appliquer le changement en lot.")
            }
        } catch (e) {
            toast.error("Erreur réseau.")
        }
        setIsSyncing(false)
    }

    const categoriesByType = categories.reduce((acc: any, cat: any) => {
        if (!acc[cat.type]) acc[cat.type] = []
        acc[cat.type].push(cat)
        return acc
    }, {})

    // Sort transactions
    const sortedTransactions = [...transactions].sort((a, b) => {
        if (sortBy === 'date') {
            return new Date(b.date).getTime() - new Date(a.date).getTime()
        } else {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
    })

    // Group transactions by month
    const grouped = sortedTransactions.reduce((acc: any, t) => {
        const month = format(new Date(t.date), 'MMMM yyyy', { locale: fr })
        if (!acc[month]) acc[month] = []
        acc[month].push(t)
        return acc
    }, {})

    // Months ordered by latest date in that month
    const months = Object.keys(grouped).sort((a, b) => {
        const dateA = new Date(grouped[a][0].date)
        const dateB = new Date(grouped[b][0].date)
        return dateB.getTime() - dateA.getTime()
    })

    return (
        <div className="space-y-8">
            <div className="flex justify-end mb-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <ListFilter className="h-4 w-4" />
                            Trier par : {sortBy === 'date' ? 'Date opération' : 'Date de saisie'}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSortBy('date')}>
                            Date opération
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('createdAt')}>
                            Date de saisie (récent d'abord)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {months.map(month => (
                <div key={month} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold capitalize text-foreground">
                            {month}
                        </h3>
                        <div className="h-px flex-1 bg-border/60" />
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                            {grouped[month].length} {grouped[month].length > 1 ? 'opérations' : 'opération'}
                        </Badge>
                    </div>

                    <Card className="overflow-hidden border-border bg-card shadow-sm transition-all hover:shadow-md">
                        <div className="divide-y divide-border">
                            {grouped[month].map((t: any) => (
                                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-4">
                                    <div className="flex items-start sm:items-center gap-4 flex-1">
                                        <div className={`mt-1 sm:mt-0 p-3 rounded-xl shadow-sm ${t.type === 'IN'
                                            ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 dark:from-emerald-900/40 dark:to-emerald-900/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                            : 'bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                                            }`}>
                                            {t.type === 'IN' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-foreground text-sm leading-tight max-w-xl line-clamp-2">
                                                {t.description}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5" title="Espèces">
                                                    <Banknote className="w-3 h-3" />
                                                    {format(new Date(t.date), 'dd MMMM yyyy', { locale: fr })}
                                                </span>

                                                <Select
                                                    value={t.categoryId || "UNCLASSIFIED"}
                                                    onValueChange={(val) => {
                                                        if (val !== "UNCLASSIFIED") {
                                                            handleAssign(t.id, val)
                                                        }
                                                    }}
                                                    disabled={loadingIds.has(t.id)}
                                                >
                                                    <SelectTrigger className={`h-6 text-[10px] px-2 font-medium w-[140px] focus:ring-0 ${t.category ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-900/50' : 'bg-background'}`}>
                                                        <SelectValue placeholder="+ Catégorie" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {!t.categoryId && <SelectItem value="UNCLASSIFIED">+ Catégorie</SelectItem>}
                                                        {Object.keys(categoriesByType).map((type) => (
                                                            <div key={type}>
                                                                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{type}</div>
                                                                {categoriesByType[type].map((cat: any) => (
                                                                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                                                        {cat.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {sortBy === 'createdAt' && (
                                                    <span className="text-[10px] text-muted-foreground/60 ml-2">
                                                        (Saisi le {format(new Date(t.createdAt), 'dd/MM HH:mm')})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 justify-end">
                                        <div className={`text-base font-bold px-3 py-1 rounded-md ${t.type === 'IN'
                                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                                            : 'text-foreground'
                                            }`}>
                                            {t.type === 'IN' ? '+' : ''}{Number(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setEditingTransaction(t)
                                                    setIsEditDialogOpen(true)
                                                }}
                                                className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={async () => {
                                                    if (confirm("Supprimer cette transaction ?")) {
                                                        const res = await deleteCashTransaction(t.id)
                                                        if (res && 'success' in res && res.success) toast.success("Transaction supprimée")
                                                        else if (res && 'message' in res) toast.error((res as any).message)
                                                        else if (res && 'error' in res) toast.error((res as any).error)
                                                    }
                                                }}
                                                className="h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="p-4 bg-muted/30 flex items-center justify-between border-t border-border">
                                <span className="text-sm text-muted-foreground font-medium">Total {month}</span>
                                <span className="font-bold text-foreground">
                                    {grouped[month].reduce((sum: number, t: any) => sum + (t.type === 'IN' ? Number(t.amount) : -Number(t.amount)), 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            ))}

            {months.length === 0 && (
                <div className="text-center py-20 bg-muted/50 rounded-2xl border border-dashed border-border">
                    <p className="text-muted-foreground font-medium">Aucune transaction trouvée.</p>
                </div>
            )}

            <EditTransactionDialog
                transaction={editingTransaction}
                categories={categories}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
            />

            <BatchAssignModal
                isOpen={modalOpen}
                onOpenChange={setModalOpen}
                transactions={modalTxs}
                onConfirm={handleModalConfirm}
                isLoading={isSyncing}
            />
        </div>
    )
}
