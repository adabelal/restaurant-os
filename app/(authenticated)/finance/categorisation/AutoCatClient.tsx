'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Brain, ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { syncFinanceIntelligence, assignTransactionCategory, findSimilarTransactions, applyCategoryToMultipleTx } from '../actions'
import { toast } from 'sonner'
import { BatchAssignModal, BatchTx } from '../components/BatchAssignModal'

type AutoCatTx = {
    id: string
    date: Date
    amount: number
    description: string
    transactionType: string | null
    paymentMethod: string | null
    thirdPartyName: string | null
}

export function AutoCatClient({
    initialTransactions,
    categories
}: {
    initialTransactions: AutoCatTx[],
    categories: { id: string, name: string, type: string }[]
}) {
    const [transactions, setTransactions] = useState<AutoCatTx[]>(initialTransactions)
    const [isSyncing, setIsSyncing] = useState(false)
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

    const handleSync = async () => {
        setIsSyncing(true)
        const promise = syncFinanceIntelligence()

        toast.promise(promise, {
            loading: "Analyse intelligente en cours...",
            success: (result) => {
                if (result?.error) {
                    throw new Error(result.error)
                }
                // When successful, the server revalidates the path,
                // so the page will reload with the new uncategorized list.
                // But initially we can just let Next.js refresh it via Server Actions
                return "Catégorisation exécutée avec succès."
            },
            error: (err) => `Erreur lors de la synchronisation : ${err.message}`
        })

        await promise
        setIsSyncing(false)
    }

    const [modalOpen, setModalOpen] = useState(false)
    const [modalTxs, setModalTxs] = useState<BatchTx[]>([])
    const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null)

    const handleAssign = async (transactionId: string, categoryId: string) => {
        setLoadingIds(prev => new Set(prev).add(transactionId))

        try {
            const res = await assignTransactionCategory(transactionId, categoryId, false)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success("Catégorie assignée.")
                setTransactions(prev => prev.filter(t => t.id !== transactionId))

                // Find similars
                const similars = await findSimilarTransactions(transactionId)
                if (similars && 'data' in similars) {
                    const similarList = (similars as any).data as BatchTx[];
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
            if (res && 'success' in res && res.success) {
                toast.success(`Catégorie appliquée à ${selectedTx.length} transaction(s).`)

                // remove them from UI
                const idsToRemove = new Set(selectedTx.map(t => t.id))
                setTransactions(prev => prev.filter(t => !idsToRemove.has(t.id)))

                setModalOpen(false)
            } else if (res && 'error' in res) {
                toast.error(res.error || "Erreur, impossible d'appliquer le changement en lot.")
            }
        } catch (e) {
            toast.error("Erreur réseau.")
        }
        setIsSyncing(false)
    }

    // Group categories by type for the Select
    const categoriesByType = categories.reduce((acc, cat) => {
        if (!acc[cat.type]) acc[cat.type] = []
        acc[cat.type].push(cat)
        return acc
    }, {} as Record<string, typeof categories>)

    return (
        <div className="space-y-8">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 dark:from-indigo-600 dark:via-indigo-800 dark:to-purple-900">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />

                <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-3 text-center md:text-left text-white">
                        <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-3 drop-shadow-sm">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                            L'Intelligence Financière
                        </h2>
                        <p className="text-indigo-100 max-w-xl text-lg opacity-90 font-medium">
                            Laissez notre système expert analyser {transactions.length} transaction{transactions.length > 1 ? 's' : ''} non classée{transactions.length > 1 ? 's' : ''}. Gagnez du temps grâce à l'auto-catégorisation intelligente de vos dépenses.
                        </p>
                    </div>
                    <Button
                        onClick={handleSync}
                        disabled={isSyncing || transactions.length === 0}
                        size="lg"
                        className="rounded-xl text-base font-bold bg-white text-indigo-600 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:hover:scale-100 w-full md:w-auto px-8 py-6"
                    >
                        {isSyncing ? (
                            <><RefreshCw className="mr-3 h-5 w-5 animate-spin" /> Analyse des flux...</>
                        ) : (
                            <><Sparkles className="mr-3 h-5 w-5" /> Lancer l'IA</>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                        À classer manuellement
                        <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs py-1 px-3 rounded-full font-bold shadow-sm">
                            {transactions.length} restante{transactions.length > 1 ? 's' : ''}
                        </span>
                    </h3>
                </div>

                <div className="grid gap-3">
                    {transactions.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center flex flex-col items-center gap-4 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                            <div className="h-24 w-24 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2 shadow-inner ring-8 ring-emerald-50 dark:ring-emerald-900/10">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                            </div>
                            <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Vue dégagée !</h4>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md text-lg">
                                Parfait, toutes vos transactions sont minutieusement classées. Aucune action n'est requise.
                            </p>
                        </div>
                    ) : (
                        transactions.map((t) => (
                            <div key={t.id} className="group flex flex-col md:flex-row items-start md:items-center gap-5 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300">
                                {/* Icon section */}
                                <div className={`shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl shadow-inner ${t.amount >= 0
                                    ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 border border-emerald-200 dark:from-emerald-900/20 dark:to-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800'
                                    : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600 border border-slate-200 dark:from-slate-800/50 dark:to-slate-900 dark:text-slate-400 dark:border-slate-700'
                                    }`}>
                                    {t.amount >= 0 ? <ArrowUpRight className="h-7 w-7" /> : <ArrowDownRight className="h-7 w-7" />}
                                </div>

                                {/* Details section */}
                                <div className="flex-1 min-w-0 space-y-1.5 w-full">
                                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-base md:text-lg">
                                        {t.description}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                                            {format(new Date(t.date), 'dd MMM yyyy', { locale: fr })}
                                        </span>
                                        {t.thirdPartyName && (
                                            <span className="flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 dark:bg-indigo-600" />
                                                <span className="text-slate-700 dark:text-slate-300">{t.thirdPartyName}</span>
                                            </span>
                                        )}
                                        {t.paymentMethod && (
                                            <span className="flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                <span>{t.paymentMethod}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Amount & Select section */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
                                    <div className={`text-[1.35rem] font-extrabold tracking-tight shrink-0 ${t.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                    </div>
                                    <div className="w-full sm:w-[280px]">
                                        <Select
                                            onValueChange={(val) => handleAssign(t.id, val)}
                                            disabled={loadingIds.has(t.id)}
                                        >
                                            <SelectTrigger className="w-full h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-400 transition-colors focus:ring-2 focus:ring-indigo-500/20 shadow-inner font-medium text-slate-700 dark:text-slate-300">
                                                <SelectValue placeholder="Choisir une catégorie..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[350px] rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                                                {Object.entries(categoriesByType).map(([type, cats]) => (
                                                    <div key={type} className="mb-2 last:mb-0">
                                                        <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                                                            {type}
                                                        </div>
                                                        {cats.map(cat => (
                                                            <SelectItem key={cat.id} value={cat.id} className="rounded-lg mx-1 my-0.5 focus:bg-indigo-50 text-sm font-medium dark:focus:bg-indigo-900/40 cursor-pointer">
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
