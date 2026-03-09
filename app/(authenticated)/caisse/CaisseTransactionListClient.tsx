'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownRight, CreditCard, Search, Building2, Banknote, HelpCircle, FileText, FilterX, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
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

    const handlePrevMonth = () => {
        const currentIndex = availableMonths.indexOf(monthFilter)
        if (currentIndex !== -1 && currentIndex < availableMonths.length - 1) {
            setMonthFilter(availableMonths[currentIndex + 1])
        }
    }

    const handleNextMonth = () => {
        const currentIndex = availableMonths.indexOf(monthFilter)
        if (currentIndex !== -1 && currentIndex > 0) {
            setMonthFilter(availableMonths[currentIndex - 1])
        }
    }

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
            {/* KPI Cards (Dynamic - Simplified & Clean) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-border/50 shadow-sm">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Filtré</p>
                    <div className="text-xl font-black">{filtered.length} <span className="text-[10px] font-medium text-muted-foreground">tx</span></div>
                </div>
                <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-border/50 shadow-sm">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Solde Filtré</p>
                    <div className={`text-xl font-black ${(totalIncome - totalExpense) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {(totalIncome - totalExpense).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                </div>
                <div className="hidden lg:block bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-border/50 shadow-sm">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Entrées (F)</p>
                    <div className="text-xl font-black text-emerald-600">
                        {totalIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                </div>
                <div className="bg-amber-500/5 px-4 py-3 rounded-xl border border-amber-500/20 shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Auto-Categorisation</p>
                        <Link href="/finance/categorisation" className="text-sm font-bold text-amber-700 hover:underline flex items-center gap-1">
                            Lancer l'IA <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    </div>
                </div>
            </div>

            {/* Main List Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                {/* TOOLBAR */}
                <div className="p-4 border-b border-border/50 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative w-full lg:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher une transaction..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-white dark:bg-slate-900 border-border/60 rounded-xl h-11 focus:ring-amber-500/20"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-border/60 p-1 shadow-sm h-11">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                onClick={handlePrevMonth}
                                disabled={monthFilter === 'ALL' || availableMonths.indexOf(monthFilter) === availableMonths.length - 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Select value={monthFilter} onValueChange={setMonthFilter}>
                                <SelectTrigger className="border-none shadow-none focus:ring-0 w-[130px] h-8 text-xs font-bold capitalize bg-transparent">
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
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                onClick={handleNextMonth}
                                disabled={monthFilter === 'ALL' || availableMonths.indexOf(monthFilter) === 0}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[120px] h-11 bg-white dark:bg-slate-900 border-border/60 rounded-xl text-xs font-bold focus:ring-amber-500/20 shadow-sm">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tous types</SelectItem>
                                <SelectItem value="INCOME">Recettes</SelectItem>
                                <SelectItem value="EXPENSE">Dépenses</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[150px] h-11 bg-white dark:bg-slate-900 border-border/60 rounded-xl text-xs font-bold focus:ring-amber-500/20 shadow-sm">
                                <SelectValue placeholder="Catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Toutes catégories</SelectItem>
                                <SelectItem value="UNCLASSIFIED">Non catégorisé</SelectItem>
                                {Object.entries(categoriesByType).map(([type, cats]) => (
                                    <div key={type}>
                                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">{type}</div>
                                        {cats.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>

                        {(search || typeFilter !== 'ALL' || categoryFilter !== 'ALL' || monthFilter !== (availableMonths.length > 0 ? availableMonths[0] : 'ALL')) && (
                            <Button variant="ghost" size="icon" onClick={resetFilters} className="h-11 w-11 rounded-xl hover:bg-rose-50 hover:text-rose-500">
                                <FilterX className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* LIST / TABLE HEADER (Desktop Only) */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/50 dark:bg-slate-800/10 border-b border-border/50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="col-span-5">Détails de la Transaction</div>
                    <div className="col-span-2">Méthode & Date</div>
                    <div className="col-span-3">Catégorie</div>
                    <div className="col-span-2 text-right">Montant</div>
                </div>

                {/* LIST CONTENT */}
                <div className="divide-y divide-border/50">
                    {filtered.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center gap-3">
                            <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300">
                                <Search className="h-8 w-8" />
                            </div>
                            <p className="text-muted-foreground font-medium">Aucune transaction trouvée.</p>
                            <Button variant="link" onClick={resetFilters} className="text-amber-600">Réinitialiser les filtres</Button>
                        </div>
                    ) : (
                        filtered.map((t) => (
                            <div key={t.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200">
                                {/* Desktop Row */}
                                <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                                    <div className="col-span-5 flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-colors ${t.amount >= 0
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50'
                                            : 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:border-slate-800'
                                            }`}>
                                            {t.amount >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-sm text-foreground leading-tight">
                                                {t.thirdPartyName && (
                                                    <span className="text-indigo-600 dark:text-indigo-400 mr-2">{t.thirdPartyName}</span>
                                                )}
                                                {t.description}
                                            </p>
                                            {t.reference && (
                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                    <Badge variant="outline" className="text-[9px] px-1.5 h-4 font-medium opacity-60">
                                                        {t.reference.includes('ENABLE_BANKING') ? 'Auto-Import' : t.reference}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
                                            {getMethodIcon(t.paymentMethod)}
                                            <span className="capitalize">{t.paymentMethod?.toLowerCase() || 'Espèces'}</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-medium">
                                            {format(t.date, 'dd MMM yyyy', { locale: fr })}
                                        </p>
                                    </div>

                                    <div className="col-span-3">
                                        <Select
                                            value={t.categoryId || "UNCLASSIFIED"}
                                            onValueChange={(val) => {
                                                if (val !== "UNCLASSIFIED") {
                                                    handleAssign(t.id, val, !!t.categoryId)
                                                }
                                            }}
                                            disabled={loadingIds.has(t.id)}
                                        >
                                            <SelectTrigger className={`h-8 text-[11px] px-3 font-bold w-full max-w-[180px] rounded-lg transition-all ${t.categoryId ? 'bg-indigo-50/50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-100/50 dark:border-indigo-800/50' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'}`}>
                                                <SelectValue placeholder="+ Catégorie" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {!t.categoryId && <SelectItem value="UNCLASSIFIED">+ Catégorie</SelectItem>}
                                                {Object.entries(categoriesByType).map(([type, cats]) => (
                                                    <div key={type}>
                                                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">{type}</div>
                                                        {cats.map(cat => (
                                                            <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                                                {cat.name}
                                                            </SelectItem>
                                                        ))}
                                                    </div>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="col-span-2 text-right">
                                        <div className={`text-base font-black ${t.amount >= 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                                            {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Row (Below LG) */}
                                <div className="lg:hidden p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 shadow-sm rounded-xl flex items-center justify-center ${t.amount >= 0
                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
                                            : 'bg-slate-50 text-slate-600 dark:bg-slate-800'
                                            }`}>
                                            {t.amount >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-foreground leading-tight line-clamp-1">
                                                {t.thirdPartyName || t.description}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {format(t.date, 'dd/MM/yy')} • {t.categoryName || 'Non classé'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${t.amount >= 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                                            {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        </p>
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                            <span className="text-[9px] uppercase font-bold text-muted-foreground/60">{t.paymentMethod || 'Espèces'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

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
