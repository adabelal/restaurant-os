'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Check, X, BookKey, Tags } from 'lucide-react'
import { createCategorizationRule, deleteCategorizationRule, findRuleMatchingTransactions, applyCategoryToMultipleTx } from '../actions'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { BatchAssignModal, BatchTx } from '../components/BatchAssignModal'
import { cn } from '@/lib/utils'

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
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header section inspired by screenshot */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Gérer les Auto-Règles</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Configurez des mots-clés pour classer automatiquement vos flux entrants.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Input
                            placeholder="Rechercher une règle..."
                            className="h-11 pl-10 w-full sm:w-64 rounded-2xl bg-white border-slate-200 group-hover:border-emerald-300 transition-all font-medium"
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsCreating(true)}
                        className="rounded-2xl font-black h-11 px-6 bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="mr-2 h-5 w-5 stroke-[3]" /> Nouvelle Règle
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {rules.map(rule => (
                    <Card key={rule.id} className="group relative overflow-hidden bg-white dark:bg-slate-900 border-none shadow-sm rounded-[32px] hover:shadow-2xl transition-all duration-500 flex flex-col pt-0">
                        <CardContent className="p-8 pb-6 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className="h-14 w-14 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <BookKey className="w-7 h-7" />
                                </div>
                                <Badge className="bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-none font-black text-[9px] uppercase tracking-widest px-2.5 py-1">
                                    INCLUS
                                </Badge>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight truncate px-0.5">
                                        {rule.keyword}
                                    </h4>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 min-h-[1.5rem]">
                                        <Tags className="w-3 h-3 opacity-40 shrink-0" />
                                        <span className="truncate">{rule.categoryName}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {rule.matchType === 'CONTAINS' ? 'Mot clé' : 'Exact'}
                                </p>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl" onClick={() => handleDelete(rule.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Create card - inspired by empty slot in screenshot */}
                {isCreating ? (
                    <Card className="overflow-hidden border-2 border-emerald-500-20 shadow-2xl bg-white dark:bg-slate-900 rounded-[32px] p-8 animate-in zoom-in-95 duration-300 flex flex-col gap-5">
                        <h3 className="font-black text-lg tracking-tight">Nouvelle Règle</h3>
                        <div className="space-y-3">
                            <Input
                                placeholder="Mot-clé (Ex: URSSAF)"
                                value={newKeyword}
                                onChange={e => setNewKeyword(e.target.value)}
                                className="h-12 border-slate-200 rounded-2xl font-bold bg-slate-50 text-slate-900 px-4"
                                autoFocus
                            />
                            <Select value={newMatch} onValueChange={setNewMatch}>
                                <SelectTrigger className="h-12 border-slate-200 rounded-2xl font-bold bg-slate-50">
                                    <SelectValue placeholder="Match" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="CONTAINS" className="rounded-xl font-bold">Contient</SelectItem>
                                    <SelectItem value="EXACT" className="rounded-xl font-bold">Mot Exact</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={newCatId} onValueChange={setNewCatId}>
                                <SelectTrigger className="h-12 border-slate-200 rounded-2xl font-medium bg-slate-50">
                                    <SelectValue placeholder="Catégorie..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[350px] rounded-2xl">
                                    {Object.entries(categoriesByType).map(([type, cats]) => (
                                        <div key={type} className="mb-2 last:mb-0">
                                            <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">{type}</div>
                                            {cats.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id} className="rounded-xl font-bold">
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </div>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button className="flex-1 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 font-bold" onClick={handleCreate}>
                                Ajouter
                            </Button>
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl" onClick={() => setIsCreating(false)}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div
                        onClick={() => setIsCreating(true)}
                        className="group flex flex-col items-center justify-center p-8 bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-500 min-h-[300px]"
                    >
                        <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-[24px] shadow-sm flex items-center justify-center text-slate-300 group-hover:text-emerald-500 group-hover:scale-110 transition-all mb-6">
                            <Plus className="w-8 h-8" />
                        </div>
                        <h3 className="font-black text-xl text-slate-800 dark:text-slate-200">Ajouter Règle</h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Gagner du temps</p>
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
