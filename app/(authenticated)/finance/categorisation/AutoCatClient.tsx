'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Brain, ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { syncFinanceIntelligence, assignTransactionCategory } from '../actions'
import { toast } from 'sonner'

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

    const handleAssign = async (transactionId: string, categoryId: string) => {
        setLoadingIds(prev => new Set(prev).add(transactionId))

        try {
            const res = await assignTransactionCategory(transactionId, categoryId)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success("Catégorie assignée.")
                setTransactions(prev => prev.filter(t => t.id !== transactionId))
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

    // Group categories by type for the Select
    const categoriesByType = categories.reduce((acc, cat) => {
        if (!acc[cat.type]) acc[cat.type] = []
        acc[cat.type].push(cat)
        return acc
    }, {} as Record<string, typeof categories>)

    return (
        <div className="space-y-6">
            <Card className="bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900">
                <CardHeader className="pb-4">
                    <CardTitle className="text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        Lancer l'Analyse Intelligente
                    </CardTitle>
                    <CardDescription className="text-indigo-600/80 dark:text-indigo-400/80">
                        Notre système va analyser vos {transactions.length} transactions non classées et tenter de les assigner automatiquement selon les règles métier et vos habitudes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleSync}
                        disabled={isSyncing || transactions.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isSyncing ? (
                            <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Analyse en cours...</>
                        ) : (
                            <><Brain className="mr-2 h-4 w-4" /> Exécuter la Catégorisation Auto</>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-lg flex justify-between items-center">
                        <span>Transactions à classer manuellement</span>
                        <span className="text-muted-foreground text-sm bg-muted px-2 py-1 rounded-md">{transactions.length} restent</span>
                    </CardTitle>
                </CardHeader>
                <div className="divide-y divide-border">
                    {transactions.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                            <p className="text-muted-foreground font-medium">Parfait, toutes vos transactions sont catégorisées !</p>
                        </div>
                    ) : (
                        transactions.map((t) => (
                            <div key={t.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-4">
                                <div className="flex items-start md:items-center gap-4 flex-1">
                                    <div className={`mt-1 md:mt-0 p-3 rounded-xl shadow-sm ${t.amount >= 0
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50'
                                        : 'bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-900 dark:border-slate-800/50'
                                        }`}>
                                        {t.amount >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                    </div>
                                    <div className="space-y-1 w-full max-w-xl">
                                        <p className="font-semibold text-foreground text-sm">{t.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{format(new Date(t.date), 'dd MMM yyyy', { locale: fr })}</span>
                                            {t.thirdPartyName && (
                                                <>
                                                    <span>•</span>
                                                    <span className="font-medium text-primary">{t.thirdPartyName}</span>
                                                </>
                                            )}
                                            {t.paymentMethod && (
                                                <>
                                                    <span>•</span>
                                                    <span>{t.paymentMethod}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row items-end md:items-center gap-4 w-full md:w-auto">
                                    <div className="text-base font-bold whitespace-nowrap">
                                        {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                    </div>

                                    <div className="w-full md:w-[250px]">
                                        <Select
                                            onValueChange={(val) => handleAssign(t.id, val)}
                                            disabled={loadingIds.has(t.id)}
                                        >
                                            <SelectTrigger className="w-full bg-background mt-1 md:mt-0">
                                                <SelectValue placeholder="Choisir une catégorie..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(categoriesByType).map(([type, cats]) => (
                                                    <div key={type}>
                                                        {cats.map(cat => (
                                                            <SelectItem key={cat.id} value={cat.id}>
                                                                {cat.name} <span className="text-xs text-muted-foreground opacity-50 ml-2">({type})</span>
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
            </Card>
        </div>
    )
}
