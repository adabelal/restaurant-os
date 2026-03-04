'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Edit2, Check, X, Tags, RefreshCw } from 'lucide-react'
import { createFinanceCategory, updateFinanceCategory, deleteFinanceCategory } from '../actions'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

type Category = {
    id: string
    name: string
    type: string
    transactionCount: number
    fixedCostCount: number
}

const TYPE_LABELS: Record<string, string> = {
    FIXED_COST: 'Charge Fixe',
    VARIABLE_COST: 'Charge Variable',
    REVENUE: 'Recette (CA)',
    TAX: 'Taxe / Impôt',
    FINANCIAL: 'Frais Bancaire',
    INVESTMENT: 'Investissement',
    SALARY: 'Salaire',
    INTERNAL_TRANSFER: 'Dépôt/Retrait Especes',
    TRANSIT: 'Pourboires / Transit'
}

export function CategoryListClient({
    initialCategories,
    categoryTypes
}: {
    initialCategories: Category[],
    categoryTypes: string[]
}) {
    const [categories, setCategories] = useState<Category[]>(initialCategories)

    // Create state
    const [isCreating, setIsCreating] = useState(false)
    const [newName, setNewName] = useState('')
    const [newType, setNewType] = useState<string>('VARIABLE_COST')

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editType, setEditType] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)

    const handleCreate = async () => {
        if (!newName.trim()) return toast.error("Le nom est requis.")
        setIsLoading(true)
        try {
            const res = await createFinanceCategory(newName.trim(), newType as any)
            if (res?.error) {
                toast.error(res.error)
            } else if (res && 'data' in res && res.data) {
                toast.success("Catégorie créée.")
                setCategories(prev => [...prev, { ...res.data, transactionCount: 0, fixedCostCount: 0 }] as any)
                setIsCreating(false)
                setNewName('')
            }
        } catch (e) {
            toast.error("Erreur serveur.")
        }
        setIsLoading(false)
    }

    const startEdit = (cat: Category) => {
        setEditingId(cat.id)
        setEditName(cat.name)
        setEditType(cat.type)
    }

    const handleUpdate = async () => {
        if (!editingId || !editName.trim()) return
        setIsLoading(true)
        try {
            const res = await updateFinanceCategory(editingId, editName.trim(), editType as any)
            if (res?.error) {
                toast.error(res.error)
            } else if (res && 'data' in res && res.data) {
                toast.success("Catégorie mise à jour.")
                setCategories(prev => prev.map(c => c.id === editingId ? { ...c, name: editName, type: editType } : c))
                setEditingId(null)
            }
        } catch (e) {
            toast.error("Erreur serveur.")
        }
        setIsLoading(false)
    }

    const handleDelete = async (id: string, count: number) => {
        if (count > 0) {
            return toast.error(`Impossible de supprimer, ${count} transactions y sont liées !`)
        }
        if (!window.confirm("Voulez-vous vraiment supprimer cette catégorie ?")) return

        setIsLoading(true)
        try {
            const res = await deleteFinanceCategory(id)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success("Catégorie supprimée.")
                setCategories(prev => prev.filter(c => c.id !== id))
            }
        } catch (e) {
            toast.error("Erreur serveur.")
        }
        setIsLoading(false)
    }

    // Group categories by type for display
    const grouped = categories.reduce((acc, cat) => {
        if (!acc[cat.type]) acc[cat.type] = []
        acc[cat.type].push(cat)
        return acc
    }, {} as Record<string, typeof categories>)

    return (
        <div className="space-y-8">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-500 via-violet-600 to-fuchsia-700 dark:from-violet-600 dark:via-violet-800 dark:to-fuchsia-900">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-3 text-center md:text-left text-white">
                        <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-3 drop-shadow-sm">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                                <Tags className="w-6 h-6 text-white" />
                            </div>
                            Plan Comptable
                        </h2>
                        <p className="text-violet-100 max-w-xl text-lg opacity-90 font-medium">
                            Structurez l'architecture financière du restaurant. Vos catégories alimenteront de façon dynamique les rapports et les graphiques de résultat.
                        </p>
                    </div>

                    {!isCreating ? (
                        <Button
                            onClick={() => setIsCreating(true)}
                            size="lg"
                            className="rounded-xl text-base font-bold bg-white text-violet-600 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-xl w-full md:w-auto px-8 py-6"
                        >
                            <Plus className="mr-3 h-5 w-5" /> Nouvelle Catégorie
                        </Button>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-md shadow-xl w-full md:w-auto border border-white/20">
                            <Input
                                placeholder="Nom de la catégorie"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="h-12 border-0 bg-white dark:bg-slate-900 focus-visible:ring-2 focus-visible:ring-violet-400 text-slate-800 dark:text-slate-200 w-full sm:w-56 font-bold rounded-xl placeholder:text-slate-400"
                                autoFocus
                            />
                            <Select value={newType} onValueChange={setNewType}>
                                <SelectTrigger className="h-12 border-0 bg-white dark:bg-slate-900 ring-0 focus:ring-2 focus:ring-violet-400 w-full sm:w-[200px] rounded-xl font-semibold text-slate-700 dark:text-slate-200">
                                    <SelectValue placeholder="Type de flux" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[350px] rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                                    {categoryTypes.map(t => (
                                        <SelectItem key={t} value={t} className="rounded-lg mx-1 my-0.5 focus:bg-violet-50 dark:focus:bg-violet-900/40 font-medium cursor-pointer">
                                            {TYPE_LABELS[t] || t}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2 mt-2 sm:mt-0 px-1">
                                <Button size="icon" onClick={handleCreate} disabled={isLoading} className="h-12 w-12 rounded-xl bg-violet-500 hover:bg-violet-400 text-white shadow-md border border-violet-400 cursor-pointer transition-transform hover:scale-105 active:scale-95">
                                    {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-6 h-6" />}
                                </Button>
                                <Button size="icon" onClick={() => setIsCreating(false)} className="h-12 w-12 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer transition-all border border-white/10 hover:border-white/30">
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
                {Object.entries(grouped).map(([type, cats]) => (
                    <div key={type} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-xs flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-violet-500 shadow-sm" />
                                {TYPE_LABELS[type] || type}
                            </h3>
                            <Badge className="bg-violet-100/80 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 font-bold border-0 px-2 py-0.5 shadow-inner">
                                {cats.length}
                            </Badge>
                        </div>

                        <div className="p-3 space-y-1.5 flex-1">
                            {cats.map(cat => (
                                <div key={cat.id} className="group relative p-3 flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl hover:bg-violet-50/50 dark:hover:bg-violet-900/10 border border-transparent hover:border-violet-200 dark:hover:border-violet-800 transition-all">
                                    {editingId === cat.id ? (
                                        <div className="flex items-center gap-2 w-full animate-in fade-in duration-300">
                                            <Input
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                className="h-10 border-slate-200 dark:border-slate-700 focus-visible:ring-violet-400 font-semibold"
                                                autoFocus
                                            />
                                            <Button size="icon" variant="ghost" className="h-10 w-10 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl" onClick={handleUpdate} disabled={isLoading}>
                                                <Check className="h-5 w-5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl" onClick={() => setEditingId(null)}>
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-1 min-w-0 pr-4 flex flex-col gap-0.5">
                                                <p className="font-bold text-slate-900 dark:text-slate-100 text-[15px] truncate">
                                                    {cat.name}
                                                </p>
                                                {cat.transactionCount > 0 && (
                                                    <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                        {cat.transactionCount} transaction{cat.transactionCount > 1 ? 's' : ''}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-lg transition-colors" onClick={() => startEdit(cat)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-0 disabled:hover:bg-transparent rounded-lg transition-colors"
                                                    disabled={cat.transactionCount > 0 || cat.fixedCostCount > 0 || isLoading}
                                                    onClick={() => handleDelete(cat.id, cat.transactionCount + cat.fixedCostCount)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
