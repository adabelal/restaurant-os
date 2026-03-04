'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownRight, CreditCard, Search, Building2, Banknote, HelpCircle, FileText, FilterX, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { assignTransactionCategory, findSimilarTransactions, applyCategoryToMultipleTx } from '../finance/actions'
import { toast } from 'sonner'
import { BatchAssignModal, BatchTx } from '../finance/components/BatchAssignModal'

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
    categoryId: string | null
}

export function CaisseTransactionListClient({
    initialTransactions,
    categories
}: {
    initialTransactions: TransformedTx[],
    categories: { id: string, name: string, type: string }[]
}) {
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('ALL')
    const [methodFilter, setMethodFilter] = useState<string>('ALL')
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

    const availableMonths = useMemo(() => {
        const months = new Set<string>()
        initialTransactions.forEach(tx => {
            months.add(format(tx.date, 'yyyy-MM'))
        })
        return Array.from(months).sort().reverse()
    }, [initialTransactions])

    // Par défaut on affiche le mois le plus récent
    const [monthFilter, setMonthFilter] = useState<string>(
        availableMonths.length > 0 ? availableMonths[0] : 'ALL'
    )

    const [isSyncing, setIsSyncing] = useState(false)
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

    const [modalOpen, setModalOpen] = useState(false)
    const [modalTxs, setModalTxs] = useState<BatchTx[]>([])
    const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null)

    const handleSyncBank = async () => { };

    const handleAssign = async (transactionId: string, categoryId: string, hasExistingCategory: boolean) => {
        setLoadingIds(prev => new Set(prev).add(transactionId))
        try {
            // First apply directly to the clicked row
            const res = await assignTransactionCategory(transactionId, categoryId, false)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success("Catégorie assignée.")

                // Then check for similar items without blocking the UI
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

        setIsSyncing(true) // we reuse it to show a loading state on the button
        try {
            const res = await applyCategoryToMultipleTx(selectedTx.map(t => ({ id: t.id, isCash: true })), pendingCategoryId)
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

    const categoriesByType = categories.reduce((acc, cat) => {
        if (!acc[cat.type]) acc[cat.type] = []
        acc[cat.type].push(cat)
        return acc
    }, {} as Record<string, typeof categories>)

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
            if (false) {
                const method = tx.paymentMethod || 'OTHER'
                if (method !== methodFilter) return false
            }

            // Category Filter
            if (categoryFilter !== 'ALL') {
                if (categoryFilter === 'UNCLASSIFIED' && tx.categoryId !== null) return false
                if (categoryFilter !== 'UNCLASSIFIED' && tx.categoryId !== categoryFilter) return false
            }

            // Month Filter
            if (monthFilter !== 'ALL') {
                if (format(tx.date, 'yyyy-MM') !== monthFilter) return false
            }

            return true
        })
    }, [initialTransactions, search, typeFilter, methodFilter, categoryFilter, monthFilter])

    const totalIncome = filtered.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0)
    const totalExpense = filtered.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0)
    const globalBalance = initialTransactions.reduce((acc, t) => acc + t.amount, 0)

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
        setCategoryFilter('ALL')
        setMonthFilter(availableMonths.length > 0 ? availableMonths[0] : 'ALL')
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards (Dynamic) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Card className="shadow-sm border-border bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Transactions (Filtre)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filtered.length}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-indigo-100 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-900/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Solde filtré</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${(totalIncome - totalExpense) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {(totalIncome - totalExpense).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-900/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Solde Global (Actuel)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${globalBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {globalBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-border bg-card flex flex-col items-center justify-center p-4 gap-3">

                    <div className="w-full text-center flex-1 flex flex-col items-center justify-center p-4">
                        <Banknote className="w-8 h-8 text-amber-500 mb-2 opacity-80" />
                        <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Historique Espèces</span>
                    </div>

                    <Button asChild className="w-full font-bold">
                        <Link href="/finance/transactions/auto-categorisation">
                            Catégoriser (Auto)
                        </Link>
                    </Button>
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
                        <Select value={monthFilter} onValueChange={setMonthFilter}>
                            <SelectTrigger className="w-full sm:w-[150px] flex-1 sm:flex-none bg-background capitalize">
                                <SelectValue placeholder="Mois" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tous les mois</SelectItem>
                                {availableMonths.map(m => {
                                    const dateObj = new Date(`${m}-01T12:00:00Z`);
                                    return (
                                        <SelectItem key={m} value={m} className="capitalize">
                                            {format(dateObj, 'MMMM yyyy', { locale: fr })}
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-[130px] flex-1 sm:flex-none bg-background">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tous les types</SelectItem>
                                <SelectItem value="INCOME">Recettes</SelectItem>
                                <SelectItem value="EXPENSE">Dépenses</SelectItem>
                            </SelectContent>
                        </Select>



                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full sm:w-[160px] flex-1 sm:flex-none bg-background">
                                <SelectValue placeholder="Catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Toutes catégories</SelectItem>
                                <SelectItem value="UNCLASSIFIED">Non catégorisé</SelectItem>
                                {Object.entries(categoriesByType).map(([type, cats]) => (
                                    <div key={type}>
                                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{type}</div>
                                        {cats.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>

                        {(search || typeFilter !== 'ALL' || false || categoryFilter !== 'ALL' || monthFilter !== (availableMonths.length > 0 ? availableMonths[0] : 'ALL')) && (
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
                                                <span className="font-medium text-muted-foreground text-[11px] border-l border-border pl-2 border-dashed ml-1">{t.description}</span>
                                            ) : (
                                                t.description
                                            )}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5" title={t.paymentMethod || 'Inconnu'}>
                                                {getMethodIcon(t.paymentMethod)}
                                                {format(t.date, 'dd MMMM yyyy', { locale: fr })}
                                            </span>

                                            <Select
                                                value={t.categoryId || "UNCLASSIFIED"}
                                                onValueChange={(val) => {
                                                    if (val !== "UNCLASSIFIED") {
                                                        handleAssign(t.id, val, !!t.categoryId)
                                                    }
                                                }}
                                                disabled={loadingIds.has(t.id)}
                                            >
                                                <SelectTrigger className={`h-6 text-[10px] px-2 font-medium w-[140px] focus:ring-0 ${t.categoryName ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-900/50' : 'bg-background'}`}>
                                                    <SelectValue placeholder="+ Catégorie" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {!t.categoryId && <SelectItem value="UNCLASSIFIED">+ Catégorie</SelectItem>}
                                                    {Object.entries(categoriesByType).map(([type, cats]) => (
                                                        <div key={type}>
                                                            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{type}</div>
                                                            {cats.map(cat => (
                                                                <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                                                    {cat.name}
                                                                </SelectItem>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {t.reference && (
                                                <Badge variant="outline" className={`text-[10px] h-5 px-2 font-medium ${t.reference.includes('ENABLE_BANKING') ? 'opacity-40' : 'opacity-80 bg-slate-50'}`}>
                                                    {t.reference.includes('ENABLE_BANKING') ? 'Auto' : t.reference}
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
