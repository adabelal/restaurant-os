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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI Cards (Dynamic - Simplified & Clean) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[24px] overflow-hidden relative pt-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-6">
                        <CardTitle className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Total Filtré</CardTitle>
                        <div className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                            <Search className="h-3.5 w-3.5" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-2">
                        <div className="text-[28px] font-black text-[#0F172A] tracking-tight">{filtered.length} <span className="text-[12px] font-bold text-slate-400">opérations</span></div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[24px] overflow-hidden relative pt-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-6">
                        <CardTitle className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Solde Filtré</CardTitle>
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">Période</Badge>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-2">
                        <div className={`text-[28px] font-black tracking-tight ${(totalIncome - totalExpense) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {(totalIncome - totalExpense).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="hidden lg:block border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[24px] overflow-hidden relative pt-1">
                    <CardHeader className="flex flex-row items-center justify-between font-bold space-y-0 pb-1 px-6">
                        <CardTitle className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Entrées (F)</CardTitle>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">Cash</Badge>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-2">
                        <div className="text-[28px] font-black text-emerald-600 tracking-tight">
                            {totalIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-indigo-600 text-white rounded-[24px] overflow-hidden relative pt-1 group hover:shadow-indigo-200 transition-all cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-6">
                        <CardTitle className="text-[12px] font-semibold text-white/70 uppercase tracking-wider">Auto-Categorisation</CardTitle>
                        <RefreshCw className="w-4 h-4 text-white/50 group-hover:rotate-180 transition-transform duration-700" />
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-2">
                        <Link href="/finance/categorisation" className="flex items-center gap-2">
                            <div className="text-[22px] font-black tracking-tight flex items-center gap-1.5">
                                Lancer l'IA <ArrowUpRight className="h-5 w-5" />
                            </div>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Main List Box */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[32px] overflow-hidden">
                {/* TOOLBAR */}
                <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative w-full lg:flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Rechercher une opération de caisse..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-11 h-12 bg-slate-50/50 border-slate-100 rounded-2xl text-[14px] font-medium focus:ring-amber-500/10"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-1 bg-slate-50 rounded-2xl p-1 border border-slate-100 h-12 shadow-sm">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl hover:bg-white"
                                onClick={handlePrevMonth}
                                disabled={monthFilter === 'ALL' || availableMonths.indexOf(monthFilter) === availableMonths.length - 1}
                            >
                                <ChevronLeft className="h-4 w-4 text-slate-600" />
                            </Button>
                            <Select value={monthFilter} onValueChange={setMonthFilter}>
                                <SelectTrigger className="border-none shadow-none focus:ring-0 w-[140px] h-8 text-[13px] font-bold capitalize bg-transparent">
                                    <SelectValue placeholder="Mois" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                    <SelectItem value="ALL">Tous les mois</SelectItem>
                                    {availableMonths.map(m => {
                                        const dateObj = new Date(`${m}-01T12:00:00Z`);
                                        return (
                                            <SelectItem key={m} value={m} className="capitalize py-2.5 rounded-xl font-medium">
                                                {format(dateObj, 'MMMM yyyy', { locale: fr })}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl hover:bg-white"
                                onClick={handleNextMonth}
                                disabled={monthFilter === 'ALL' || availableMonths.indexOf(monthFilter) === 0}
                            >
                                <ChevronRight className="h-4 w-4 text-slate-600" />
                            </Button>
                        </div>

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[120px] h-12 bg-white border-slate-200 rounded-2xl text-sm font-bold text-slate-600 shadow-sm focus:ring-amber-500/10">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                <SelectItem value="ALL" className="py-2.5 rounded-xl font-medium">Tous types</SelectItem>
                                <SelectItem value="INCOME" className="py-2.5 rounded-xl font-medium text-emerald-600">Recettes</SelectItem>
                                <SelectItem value="EXPENSE" className="py-2.5 rounded-xl font-medium text-rose-600">Dépenses</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[160px] h-12 bg-white border-slate-200 rounded-2xl text-sm font-bold text-slate-600 shadow-sm focus:ring-amber-500/10">
                                <SelectValue placeholder="Catégorie" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl max-h-[400px]">
                                <SelectItem value="ALL" className="py-2.5 rounded-xl font-medium">Toutes catégories</SelectItem>
                                <SelectItem value="UNCLASSIFIED" className="py-2.5 rounded-xl font-medium text-amber-600">Non catégorisé</SelectItem>
                                {Object.entries(categoriesByType).map(([type, cats]) => (
                                    <div key={type} className="mt-2 first:mt-0">
                                        <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 mb-1">{type}</div>
                                        {cats.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id} className="py-2.5 rounded-xl text-[13px] font-medium">
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>

                        {(search || typeFilter !== 'ALL' || categoryFilter !== 'ALL' || monthFilter !== (availableMonths.length > 0 ? availableMonths[0] : 'ALL')) && (
                            <Button variant="ghost" size="icon" onClick={resetFilters} className="h-12 w-12 rounded-2xl hover:bg-rose-50 hover:text-rose-500 text-slate-400 transition-colors">
                                <FilterX className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* LIST / TABLE HEADER (Desktop Only) */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50/30 border-b border-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="col-span-5">Libellé & Détails</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-3">Catégorie</div>
                    <div className="col-span-2 text-right">Montant</div>
                </div>

                {/* LIST CONTENT */}
                <div className="divide-y divide-slate-50">
                    {filtered.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center gap-3">
                            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                                <Search className="h-10 w-10" />
                            </div>
                            <p className="text-slate-400 font-bold">Aucune opération trouvée.</p>
                            <Button variant="link" onClick={resetFilters} className="text-indigo-600">Réinitialiser les filtres</Button>
                        </div>
                    ) : (
                        filtered.map((t) => (
                            <div key={t.id} className="group flex flex-col sm:grid sm:grid-cols-12 items-center p-6 hover:bg-slate-50/70 transition-all duration-300 gap-4 sm:gap-6">
                                <div className="sm:col-span-5 flex items-center gap-5 w-full">
                                    <div className={`h-12 w-12 rounded-[18px] flex items-center justify-center border transition-all ${t.amount >= 0
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        : 'bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-white'
                                        }`}>
                                        {t.amount >= 0 ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-[#0F172A] text-[15px] leading-tight flex flex-wrap items-center gap-2">
                                            {t.thirdPartyName && (
                                                <span className="text-indigo-600">{t.thirdPartyName}</span>
                                            )}
                                            {t.description}
                                        </p>
                                        {t.reference && (
                                            <Badge variant="outline" className="text-[10px] bg-white border-slate-100 text-slate-400 font-bold py-0 px-2 rounded-full h-4">
                                                {t.reference}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="sm:col-span-2 w-full">
                                    <div className="flex items-center gap-2 text-[13px] font-bold text-[#0F172A]">
                                        <Banknote className="w-3.5 h-3.5 text-slate-300" />
                                        <span>{format(t.date, 'dd MMM yyyy', { locale: fr })}</span>
                                    </div>
                                </div>

                                <div className="sm:col-span-3 w-full">
                                    <Select
                                        value={t.categoryId || "UNCLASSIFIED"}
                                        onValueChange={(val) => {
                                            if (val !== "UNCLASSIFIED") {
                                                handleAssign(t.id, val, !!t.categoryId)
                                            }
                                        }}
                                        disabled={loadingIds.has(t.id)}
                                    >
                                        <SelectTrigger className={`h-8 text-[11px] px-3 font-bold w-full max-w-[180px] rounded-full transition-all border-none shadow-sm ${t.categoryId ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                            <SelectValue placeholder="+ Catégorie" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-xl max-h-[300px]">
                                            {!t.categoryId && <SelectItem value="UNCLASSIFIED" className="py-2.5 rounded-xl font-medium">+ Catégorie</SelectItem>}
                                            {Object.entries(categoriesByType).map(([type, cats]) => (
                                                <div key={type} className="mt-2 first:mt-0">
                                                    <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 mb-1">{type}</div>
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

                                <div className="sm:col-span-2 text-right w-full">
                                    <div className={`text-[19px] font-black tracking-tight ${t.amount >= 0 ? 'text-emerald-600' : 'text-[#0F172A]'}`}>
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
