'use client'

import React, { useState } from 'react'
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit2, ListFilter, Trash2 } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { EditTransactionDialog } from "./EditTransactionDialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteCashTransaction } from "@/app/caisse/actions"
import { toast } from "sonner"

export function MonthlyTransactionList({ transactions, categories }: { transactions: any[], categories: any[] }) {
    const [sortBy, setSortBy] = useState<'date' | 'createdAt'>('date')
    const [editingTransaction, setEditingTransaction] = useState<any>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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
                        <h3 className="text-lg font-bold capitalize text-slate-700 dark:text-slate-300">
                            {month}
                        </h3>
                        <div className="h-px flex-1 bg-border/60" />
                        <Badge variant="outline" className="bg-slate-50">
                            {grouped[month].length} {grouped[month].length > 1 ? 'opérations' : 'opération'}
                        </Badge>
                    </div>

                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="w-[120px]">Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Catégorie</TableHead>
                                    <TableHead className="text-right">Montant</TableHead>
                                    <TableHead className="w-[100px] text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {grouped[month].map((t: any) => (
                                    <TableRow key={t.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-medium">
                                            {format(new Date(t.date), 'dd/MM/yyyy')}
                                            {sortBy === 'createdAt' && (
                                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                                    Saisi le {format(new Date(t.createdAt), 'dd/MM HH:mm')}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{t.description}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal" style={{ borderColor: t.category?.color, color: t.category?.color }}>
                                                {t.category?.name || 'Sans catégorie'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-bold ${t.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {t.type === 'IN' ? '+' : ''}{Number(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        </TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-1">
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
                                                        if (res.success) toast.success("Transaction supprimée")
                                                        else toast.error(res.message)
                                                    }
                                                }}
                                                className="h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-slate-50/30 font-bold">
                                    <TableCell colSpan={3} className="text-right">Total {month}</TableCell>
                                    <TableCell className="text-right text-foreground font-bold">
                                        {grouped[month].reduce((sum: number, t: any) => sum + Number(t.amount), 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            ))}

            {months.length === 0 && (
                <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed">
                    <p className="text-muted-foreground">Aucune transaction trouvée.</p>
                </div>
            )}

            <EditTransactionDialog
                transaction={editingTransaction}
                categories={categories}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
            />
        </div>
    )
}
