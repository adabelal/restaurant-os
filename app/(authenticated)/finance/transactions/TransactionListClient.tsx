'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownRight, CreditCard, Search, Building2, Banknote, HelpCircle, FileText, FilterX } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export type TransformedTx = {
    id: string
    date: Date
    amount: number
    description: string
    reference: string | null
    transactionType: string | null
    paymentMethod: string | null
    thirdPartyName: string | null
    categoryName: string | null
}

export function TransactionListClient({ initialTransactions }: { initialTransactions: TransformedTx[] }) {
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('ALL')
    const [methodFilter, setMethodFilter] = useState<string>('ALL')

    const filtered = useMemo(() => {
        return initialTransactions.filter((tx) => {
            // Search text
            if (search) {
                const term = search.toLowerCase()
                const matchDesc = tx.description.toLowerCase().includes(term)
                const matchThird = (tx.thirdPartyName || '').toLowerCase().includes(term)
                const matchCat = (tx.categoryName || '').toLowerCase().includes(term)
                if (!matchDesc && !matchThird && !matchCat) return false
            }

            // Type
            if (typeFilter !== 'ALL') {
                if (typeFilter === 'INCOME' && tx.amount < 0) return false
                if (typeFilter === 'EXPENSE' && tx.amount > 0) return false
            }

            // Payment method
            if (methodFilter !== 'ALL') {
                const method = tx.paymentMethod || 'OTHER'
                if (method !== methodFilter) return false
            }

            return true
        })
    }, [initialTransactions, search, typeFilter, methodFilter])

    const totalIncome = filtered.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0)
    const totalExpense = filtered.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0)

    const getMethodIcon = (method: string | null) => {
        switch (method) {
            case 'CARD': return <CreditCard className="w-4 h-4" />
            case 'TRANSFER': return <Building2 className="w-4 h-4" />
            case 'DIRECT_DEBIT': return <FileText className="w-4 h-4" />
            case 'CASH': return <Banknote className="w-4 h-4" />
            default: return <HelpCircle className="w-4 h-4" />
        }
    }

    const resetFilters = () => {
        setSearch('')
        setTypeFilter('ALL')
        setMethodFilter('ALL')
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards (Dynamic) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-sm border-border bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Transactions trouvées</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filtered.length}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-emerald-100 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-900/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total des entrées affichées</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {totalIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-rose-100 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-900/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Total des sorties affichées</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                            {totalExpense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main List Box */}
            <Card className="shadow-sm border-border bg-card overflow-hidden">
                {/* TOOLBAR */}
                <div className="p-4 border-b border-border bg-muted/20 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-auto flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher libellé, tiers, catégorie..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>
                    <div className="flex w-full md:w-auto items-center gap-2 md:gap-3 flex-wrap justify-stretch">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-[140px] flex-1 sm:flex-none bg-background">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tous les types</SelectItem>
                                <SelectItem value="INCOME">Recettes</SelectItem>
                                <SelectItem value="EXPENSE">Dépenses</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={methodFilter} onValueChange={setMethodFilter}>
                            <SelectTrigger className="w-full sm:w-[160px] flex-1 sm:flex-none bg-background">
                                <SelectValue placeholder="Moyen de paiement" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tous les moyens</SelectItem>
                                <SelectItem value="CARD">Carte Bancaire</SelectItem>
                                <SelectItem value="TRANSFER">Virement</SelectItem>
                                <SelectItem value="DIRECT_DEBIT">Prélèvement</SelectItem>
                                <SelectItem value="CHECK">Chèque</SelectItem>
                                <SelectItem value="CASH">Espèces</SelectItem>
                                <SelectItem value="FEE">Frais Bancaires</SelectItem>
                                <SelectItem value="OTHER">Autre</SelectItem>
                            </SelectContent>
                        </Select>

                        {(search || typeFilter !== 'ALL' || methodFilter !== 'ALL') && (
                            <Button variant="ghost" size="icon" onClick={resetFilters} title="Réinitialiser les filtres">
                                <FilterX className="w-4 h-4 text-muted-foreground hover:text-rose-500" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* LIST */}
                <div className="divide-y divide-border">
                    {filtered.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            Aucune transaction ne correspond à vos filtres.
                        </div>
                    ) : (
                        filtered.map((t) => (
                            <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-4">
                                <div className="flex items-start sm:items-center gap-4">
                                    <div className={`mt-1 sm:mt-0 p-3 rounded-xl shadow-sm ${t.amount >= 0
                                        ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 dark:from-emerald-900/40 dark:to-emerald-900/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                        : 'bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                                        }`}>
                                        {t.amount >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-foreground text-sm leading-tight max-w-xl line-clamp-2">
                                            {t.thirdPartyName ? (
                                                <span className="text-indigo-600 dark:text-indigo-400 mr-2">{t.thirdPartyName}</span>
                                            ) : null}
                                            {t.thirdPartyName ? (
                                                <span className="font-normal text-muted-foreground text-xs">{t.description}</span>
                                            ) : (
                                                t.description
                                            )}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5" title={t.paymentMethod || 'Inconnu'}>
                                                {getMethodIcon(t.paymentMethod)}
                                                {format(t.date, 'dd MMMM yyyy', { locale: fr })}
                                            </span>

                                            {t.categoryName && (
                                                <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-900/50 font-medium">
                                                    {t.categoryName}
                                                </Badge>
                                            )}

                                            {t.reference && t.reference.includes('ENABLE_BANKING') && (
                                                <Badge variant="outline" className="text-[10px] h-5 px-2 font-medium opacity-60">
                                                    Auto
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={`text-right w-full sm:w-auto flex justify-end`}>
                                    <div className={`text-base font-bold px-3 py-1 rounded-md ${t.amount >= 0
                                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                                        : 'text-foreground'
                                        }`}>
                                        {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    )
}
