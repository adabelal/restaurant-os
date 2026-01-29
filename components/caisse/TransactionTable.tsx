'use client'

import { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpCircle, ArrowDownCircle, Trash2, Calendar } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { deleteCashTransaction } from "@/app/caisse/actions"
import { toast } from "sonner"

interface TransactionTableProps {
    initialTransactions: any[]
}

export function TransactionTable({ initialTransactions }: TransactionTableProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredTransactions = initialTransactions.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 bg-card p-4 rounded-xl border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher une transaction..."
                        className="pl-9 bg-muted/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[150px]">Date</TableHead>
                            <TableHead>Libellé</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Aucune transaction trouvée.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions.map((t) => (
                                <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {format(new Date(t.date), 'dd MMM yyyy', { locale: fr })}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{t.description}</span>
                                            {t.user && <span className="text-[10px] text-muted-foreground italic">Par {t.user.name}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {t.category ? (
                                            <Badge variant="outline" className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 text-blue-700 dark:text-blue-300">
                                                {t.category.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className={`flex items-center justify-end gap-2 font-bold ${t.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {t.type === 'IN' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                                            {t.type === 'IN' ? '+' : '-'} {Number(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <form action={async () => {
                                            if (confirm('Supprimer cette transaction ?')) {
                                                const res = await deleteCashTransaction(t.id)
                                                if (res.success) {
                                                    toast.success(res.message)
                                                } else {
                                                    toast.error(res.message)
                                                }
                                            }
                                        }}>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
