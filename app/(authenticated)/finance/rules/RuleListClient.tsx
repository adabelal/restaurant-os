'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Check, X, BookKey } from 'lucide-react'
import { createCategorizationRule, deleteCategorizationRule } from '../actions'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

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

    const handleCreate = async () => {
        if (!newKeyword.trim() || !newCatId) return toast.error("Le mot-clé et la catégorie sont requis.")
        setIsLoading(true)
        try {
            const res = await createCategorizationRule(newKeyword.trim(), newCatId, newMatch as any)
            if (res?.error) {
                toast.error(res.error)
            } else if (res?.data) {
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

    const categoriesByType = categories.reduce((acc, cat) => {
        if (!acc[cat.type]) acc[cat.type] = []
        acc[cat.type].push(cat)
        return acc
    }, {} as Record<string, typeof categories>)

    return (
        <div className="space-y-6">
            <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900 p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">Règles Actives</h2>
                        <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                            Ex: Si le libellé contient "GRAND FRAIS", alors c'est une "Charge Variable".
                        </p>
                    </div>
                    {!isCreating ? (
                        <Button onClick={() => setIsCreating(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Nouvelle Règle
                        </Button>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-2 bg-background p-2 rounded-xl border shadow-sm w-full md:w-auto">
                            <Input
                                placeholder="Mot-clé (Ex: URSSAF)"
                                value={newKeyword}
                                onChange={e => setNewKeyword(e.target.value)}
                                className="border-0 focus-visible:ring-0 w-full sm:w-40 uppercase"
                                autoFocus
                            />
                            <Select value={newMatch} onValueChange={setNewMatch}>
                                <SelectTrigger className="border-0 ring-0 focus:ring-0 outline-none w-full sm:w-[130px] bg-transparent">
                                    <SelectValue placeholder="Match" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CONTAINS">Contient</SelectItem>
                                    <SelectItem value="EXACT">Mot Exact</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={newCatId} onValueChange={setNewCatId}>
                                <SelectTrigger className="border-0 ring-0 focus:ring-0 outline-none w-full sm:w-[160px] bg-transparent border-l border-border rounded-none pl-3">
                                    <SelectValue placeholder="Catégorie..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(categoriesByType).map(([type, cats]) => (
                                        <div key={type}>
                                            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">{type}</div>
                                            {cats.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id} className="text-xs">{cat.name}</SelectItem>
                                            ))}
                                        </div>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1 border-l border-border pl-2">
                                <Button size="icon" variant="ghost" onClick={handleCreate} disabled={isLoading} className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50">
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setIsCreating(false)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-border">
                    {rules.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            Aucune règle personnalisée pour le moment.
                        </div>
                    ) : (
                        rules.map(rule => (
                            <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 rounded-lg flex items-center justify-center">
                                        <BookKey className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-foreground text-base tracking-wide uppercase">"{rule.keyword}"</span>
                                            <Badge variant="outline" className="text-[10px] h-5 opacity-60">
                                                {rule.matchType === 'CONTAINS' ? 'Si contient' : 'Mot exact'}
                                            </Badge>
                                        </div>
                                        <div className="text-sm font-medium text-muted-foreground mt-0.5 flex items-center gap-2">
                                            ➡️
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/50">
                                                {rule.categoryName}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                        onClick={() => handleDelete(rule.id)}
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
