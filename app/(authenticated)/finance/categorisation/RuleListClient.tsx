'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Check, X, BookKey } from 'lucide-react'
import { createCategorizationRule, deleteCategorizationRule, findRuleMatchingTransactions, applyCategoryToMultipleTx } from '../actions'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { BatchAssignModal, BatchTx } from '../components/BatchAssignModal'

type Rule = {
    id: string
    keyword: string
    matchType: string
    categoryId: string
    categoryName: string
    categoryType: string
}

export function RuleListClient({
    initialRules,
    categories
}: {
    initialRules: Rule[],
    categories: { id: string, name: string, type: string }[]
}) {
    const [rules, setRules] = useState<Rule[]>(initialRules)

    // Create state
    const [isCreating, setIsCreating] = useState(false)
    const [newKeyword, setNewKeyword] = useState('')
    const [newMatch, setNewMatch] = useState<string>('CONTAINS')
    const [newCatId, setNewCatId] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)

    const [modalOpen, setModalOpen] = useState(false)
    const [modalTxs, setModalTxs] = useState<BatchTx[]>([])
    const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null)

    const handleCreate = async () => {
        if (!newKeyword.trim() || !newCatId) return toast.error("Le mot-clé et la catégorie sont requis.")
        setIsLoading(true)
        try {
            const res = await createCategorizationRule(newKeyword.trim(), newCatId, newMatch as any)
            if (res?.error) {
                toast.error(res.error)
            } else if (res && 'data' in res && res.data) {
                toast.success("Règle créée.")
                const catInfo = categories.find(c => c.id === newCatId)
                setRules(prev => [{
                    id: res.data.id,
                    keyword: res.data.keyword,
                    matchType: res.data.matchType,
                    categoryId: res.data.categoryId,
                    categoryName: catInfo?.name || 'Inconnu',
                    categoryType: catInfo?.type || 'UNKNOWN'
                }, ...prev])
                // Check if similar txs exists to prompt the batch update
                const similars = await findRuleMatchingTransactions(newKeyword.trim(), newMatch as 'CONTAINS' | 'EXACT')
                if (similars && 'data' in similars) {
                    const similarList = (similars as any).data as BatchTx[];
                    if (similarList.length > 0) {
                        setModalTxs(similarList)
                        setPendingCategoryId(newCatId)
                        setModalOpen(true)
                    }
                }

                setIsCreating(false)
                setNewKeyword('')
                setNewCatId('')
            }
        } catch (e) {
            toast.error("Erreur serveur.")
        }
        setIsLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette règle ?")) return

        setIsLoading(true)
        try {
            const res = await deleteCategorizationRule(id)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success("Règle supprimée.")
                setRules(prev => prev.filter(c => c.id !== id))
            }
        } catch (e) {
            toast.error("Erreur serveur.")
        }
        setIsLoading(false)
    }

    const handleModalConfirm = async (selectedTx: BatchTx[]) => {
        if (!pendingCategoryId || selectedTx.length === 0) {
            setModalOpen(false)
            return
        }

        setIsLoading(true)
        try {
            const res = await applyCategoryToMultipleTx(selectedTx.map(t => ({ id: t.id, isCash: t.isCash })), pendingCategoryId)
            if (res && 'success' in res && res.success) {
                toast.success(`Règle appliquée à ${selectedTx.length} transaction(s) existante(s).`)
                setModalOpen(false)
            } else if (res && 'error' in res) {
                toast.error(res.error || "Erreur, impossible d'appliquer le changement en lot.")
            }
        } catch (e) {
            toast.error("Erreur réseau.")
        }
        setIsLoading(false)
    }

    const categoriesByType = categories.reduce((acc, cat) => {
        if (!acc[cat.type]) acc[cat.type] = []
        acc[cat.type].push(cat)
        return acc
    }, {} as Record<string, typeof categories>)

    return (
        <div className="space-y-8">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 dark:from-emerald-600 dark:via-emerald-800 dark:to-teal-900">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-3 text-center md:text-left text-white">
                        <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-3 drop-shadow-sm">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                                <BookKey className="w-6 h-6 text-white" />
                            </div>
                            Règles de Catégorisation
                        </h2>
                        <p className="text-emerald-100 max-w-xl text-lg opacity-90 font-medium">
                            Créez des règles basées sur des mots-clés pour classer automatiquement vos transactions récurrentes sans aucun effort.
                        </p>
                    </div>

                    {!isCreating ? (
                        <Button
                            onClick={() => setIsCreating(true)}
                            size="lg"
                            className="rounded-xl text-base font-bold bg-white text-emerald-600 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-xl w-full md:w-auto px-8 py-6"
                        >
                            <Plus className="mr-3 h-5 w-5" /> Nouvelle Règle
                        </Button>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-md shadow-xl w-full md:w-auto border border-white/20">
                            <Input
                                placeholder="Mot-clé (Ex: URSSAF)"
                                value={newKeyword}
                                onChange={e => setNewKeyword(e.target.value)}
                                className="h-12 border-0 bg-white dark:bg-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-400 text-slate-800 dark:text-slate-200 w-full sm:w-48 uppercase rounded-xl font-bold placeholder:text-slate-400"
                                autoFocus
                            />
                            <Select value={newMatch} onValueChange={setNewMatch}>
                                <SelectTrigger className="h-12 border-0 bg-white dark:bg-slate-900 ring-0 focus:ring-2 focus:ring-emerald-400 w-full sm:w-[140px] rounded-xl font-semibold text-slate-700 dark:text-slate-200">
                                    <SelectValue placeholder="Match" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                                    <SelectItem value="CONTAINS" className="rounded-lg mx-1 focus:bg-emerald-50 dark:focus:bg-emerald-900/40">Contient</SelectItem>
                                    <SelectItem value="EXACT" className="rounded-lg mx-1 focus:bg-emerald-50 dark:focus:bg-emerald-900/40">Mot Exact</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={newCatId} onValueChange={setNewCatId}>
                                <SelectTrigger className="h-12 border-0 bg-white dark:bg-slate-900 ring-0 focus:ring-2 focus:ring-emerald-400 w-full sm:w-[220px] rounded-xl font-medium text-slate-700 dark:text-slate-200">
                                    <SelectValue placeholder="Catégorie d'affectation..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[350px] rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                                    {Object.entries(categoriesByType).map(([type, cats]) => (
                                        <div key={type} className="mb-2 last:mb-0">
                                            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">{type}</div>
                                            {cats.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id} className="rounded-lg mx-1 my-0.5 focus:bg-emerald-50 dark:focus:bg-emerald-900/40 text-sm font-medium cursor-pointer">
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </div>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2 mt-2 sm:mt-0 px-1">
                                <Button size="icon" onClick={handleCreate} disabled={isLoading} className="h-12 w-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-md border border-emerald-400 cursor-pointer transition-transform hover:scale-105 active:scale-95">
                                    <Check className="w-6 h-6" />
                                </Button>
                                <Button size="icon" onClick={() => setIsCreating(false)} className="h-12 w-12 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer transition-all border border-white/10 hover:border-white/30">
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="mt-8">
                {rules.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center flex flex-col items-center gap-4 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                        <div className="h-24 w-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2 shadow-inner">
                            <BookKey className="w-12 h-12 text-slate-400" />
                        </div>
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Aucune règle définie</h4>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm text-lg">
                            Gagnez du temps en créant des règles pour catégoriser automatiquement vos dépenses récurrentes.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {rules.map(rule => (
                            <div key={rule.id} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] p-6 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-4 right-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 hover:text-rose-600 rounded-full h-9 w-9"
                                    onClick={() => handleDelete(rule.id)}
                                    disabled={isLoading}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <div className="space-y-5">
                                    <div className="flex items-center gap-4 pr-8">
                                        <div className="h-14 w-14 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/10 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                                            <BookKey className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg tracking-wide uppercase line-clamp-1" title={rule.keyword}>
                                                "{rule.keyword}"
                                            </h4>
                                            <Badge variant="outline" className="mt-1.5 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                                {rule.matchType === 'CONTAINS' ? 'INCLUS' : 'MOT EXACT'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-100 dark:border-slate-800">
                                        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Affectation Auto</span>
                                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-center sm:text-left line-clamp-1 border border-emerald-200/50 dark:border-emerald-800/50">
                                            {rule.categoryName}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <BatchAssignModal
                isOpen={modalOpen}
                onOpenChange={setModalOpen}
                transactions={modalTxs}
                onConfirm={handleModalConfirm}
                isLoading={isLoading}
            />
        </div>
    )
}
