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
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* AI Status Card - Inspired by screenshot */}
            <Card className="relative overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[32px]">
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-emerald-50 via-emerald-50/20 to-transparent dark:from-emerald-900/20 dark:via-emerald-900/5 dark:to-transparent" />

                <CardContent className="pt-12 pb-10 px-8 relative z-10 flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="h-24 w-24 bg-emerald-100 dark:bg-emerald-900/40 rounded-[32px] flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform duration-500">
                            <Brain className="w-12 h-12" />
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <Badge className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                System Online
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-3 max-w-xl mx-auto">
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            Analyse IA Prête
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
                            Le moteur est prêt à scanner <span className="text-emerald-500 font-bold">{transactions.length} nouvelle{transactions.length > 1 ? 's' : ''}</span> transaction{transactions.length > 1 ? 's' : ''} et suggérer des catégories basées sur votre historique.
                        </p>
                    </div>

                    <div className="mt-8 w-full max-w-sm space-y-4">
                        <Button
                            onClick={handleSync}
                            disabled={isSyncing || transactions.length === 0}
                            size="lg"
                            className="w-full h-16 rounded-3xl text-lg font-black bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isSyncing ? (
                                <><RefreshCw className="mr-3 h-6 w-6 animate-spin" /> Analyse en cours...</>
                            ) : (
                                <><Sparkles className="mr-3 h-6 w-6" /> Lancer l'analyse IA</>
                            )}
                        </Button>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
                            Dernière mise à jour il y a 2 mins
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
                        Classification Manuelle
                        <Badge variant="secondary" className="bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-none font-bold text-xs px-3 py-1">
                            {transactions.length} En attente
                        </Badge>
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {transactions.length === 0 ? (
                        <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 bg-white/50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px]">
                            <div className="h-20 w-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-2">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500/40" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-400">Tout est classé !</h4>
                        </div>
                    ) : (
                        transactions.map((t) => (
                            <Card key={t.id} className="group relative overflow-hidden bg-white dark:bg-slate-900 border-border/50 hover:border-emerald-500/30 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col pt-0">
                                <CardContent className="p-6 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {format(new Date(t.date), 'MMM dd, yyyy', { locale: fr })}
                                            </p>
                                            <p className="font-black text-lg text-slate-900 dark:text-white leading-tight line-clamp-2 min-h-[3.5rem] group-hover:text-emerald-500 transition-colors">
                                                {t.description}
                                            </p>
                                        </div>
                                        <div className={`text-xl font-black tracking-tighter ${t.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6 space-y-3">
                                        <Select
                                            onValueChange={(val) => handleAssign(t.id, val)}
                                            disabled={loadingIds.has(t.id)}
                                        >
                                            <SelectTrigger className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800 rounded-2xl hover:border-emerald-400 transition-all focus:ring-4 focus:ring-emerald-500/10 shadow-inner font-bold text-slate-600 dark:text-slate-300 px-5">
                                                <div className="flex items-center gap-2">
                                                    <Tags className="w-4 h-4 opacity-40" />
                                                    <SelectValue placeholder="Sél. une catégorie" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                                                {Object.entries(categoriesByType).map(([type, cats]) => (
                                                    <div key={type} className="mb-2 last:mb-0">
                                                        <div className="px-4 py-2 text-[9px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-50 dark:border-slate-800/50 mb-1">
                                                            {type}
                                                        </div>
                                                        {cats.map(cat => (
                                                            <SelectItem key={cat.id} value={cat.id} className="rounded-xl mx-2 my-0.5 focus:bg-emerald-50 dark:focus:bg-emerald-900/40 text-sm font-bold cursor-pointer">
                                                                {cat.name}
                                                            </SelectItem>
                                                        ))}
                                                    </div>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {t.thirdPartyName && (
                                            <div className="flex items-center gap-2 px-1">
                                                <div className="h-1 w-1 rounded-full bg-slate-300 shrink-0" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                                    {t.thirdPartyName}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                {loadingIds.has(t.id) && (
                                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                                        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                                    </div>
                                )}
                            </Card>
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
