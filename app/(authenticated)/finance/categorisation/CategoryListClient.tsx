'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Edit2, Check, X, Tags, RefreshCw, Settings, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp } from 'lucide-react'
import { createFinanceCategory, updateFinanceCategory, deleteFinanceCategory } from '../actions'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

    const toggleGroup = (type: string) => {
        setCollapsedGroups(prev => ({ ...prev, [type]: !prev[type] }))
    }

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

    // Map group labels and icons
    const GROUP_CONFIG: Record<string, { label: string, icon: any, color: string }> = {
        FIXED_COST: { label: 'Charges Fixes', icon: Settings, color: 'text-indigo-500' },
        VARIABLE_COST: { label: 'Charges Variables', icon: RefreshCw, color: 'text-emerald-500' },
        REVENUE: { label: 'Recettes (CA)', icon: ArrowUpRight, color: 'text-blue-500' },
        TAX: { label: 'Taxes & Impôts', icon: Tags, color: 'text-amber-500' },
        SALARY: { label: 'Masse Salariale', icon: Plus, color: 'text-rose-500' },
        TRANSIT: { label: 'Tips & Transit', icon: ArrowDownRight, color: 'text-cyan-500' },
        FINANCIAL: { label: 'Frais Bancaires', icon: Settings, color: 'text-slate-500' },
        INVESTMENT: { label: 'Investissements', icon: Plus, color: 'text-purple-500' },
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header info - inspired by "Manage and organize your financial categories" */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Plan Comptable</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Gérez et organisez vos catégories financières et sous-comptes efficacement.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-2xl font-bold h-11 px-6 shadow-sm border-slate-200">
                        Vue Détaillée
                    </Button>
                    <Button variant="outline" className="rounded-2xl font-bold h-11 px-6 shadow-sm border-slate-200">
                        Exporter CSV
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Object.entries(grouped).map(([type, cats]) => {
                    const config = GROUP_CONFIG[type] || { label: type, icon: Tags, color: 'text-slate-500' }
                    const Icon = config.icon

                    return (
                        <Card key={type} className="overflow-hidden border-none shadow-sm bg-white dark:bg-slate-900 rounded-[32px] flex flex-col h-full hover:shadow-xl transition-all duration-500">
                            <CardContent className="p-0">
                                <div
                                    className="p-6 pb-2 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    onClick={() => toggleGroup(type)}
                                >
                                    <h3 className="font-black text-lg tracking-tight flex items-center gap-3">
                                        <div className={cn("p-2 rounded-xl bg-slate-50 dark:bg-slate-800 shadow-inner", config.color)}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        {config.label}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[10px] uppercase tracking-widest px-2.5 py-1">
                                            {cats.length} Art.
                                        </Badge>
                                        <div className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                                            {collapsedGroups[type] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                        </div>
                                    </div>
                                </div>

                                {!collapsedGroups[type] && (
                                    <div className="px-6 py-2 animate-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-slate-800/50 pb-2 mb-2">
                                            <span>Nom de catégorie</span>
                                            <span>Transactions</span>
                                        </div>

                                        <div className="space-y-1">
                                            {cats.map(cat => (
                                                <div key={cat.id} className="group flex items-center justify-between py-2 transition-all">
                                                    {editingId === cat.id ? (
                                                        <div className="flex items-center gap-2 w-full animate-in fade-in duration-300">
                                                            <Input
                                                                value={editName}
                                                                onChange={e => setEditName(e.target.value)}
                                                                className="h-9 border-slate-200 dark:border-slate-800 font-bold text-sm bg-slate-50 dark:bg-slate-950 rounded-xl"
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-1 shrink-0">
                                                                <Button size="icon" variant="ghost" className="h-9 w-9 text-emerald-500 hover:bg-emerald-50 rounded-xl" onClick={handleUpdate}>
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400" onClick={() => setEditingId(null)}>
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex-1 min-w-0 pr-4">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">
                                                                        {cat.name}
                                                                    </p>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                        <button onClick={() => startEdit(cat)} className="text-slate-400 hover:text-emerald-500">
                                                                            <Edit2 className="h-3 w-3" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(cat.id, cat.transactionCount)}
                                                                            disabled={cat.transactionCount > 0}
                                                                            className="text-slate-400 hover:text-rose-500 disabled:opacity-0"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                                    Account #{cat.id.slice(0, 4)}
                                                                </p>
                                                            </div>
                                                            <span className="font-bold text-slate-600 dark:text-slate-400 text-sm">
                                                                {cat.transactionCount || 0}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}

                {/* Add New Category Card */}
                {isCreating ? (
                    <Card className="overflow-hidden border-2 border-emerald-500/20 shadow-xl bg-white dark:bg-slate-900 rounded-[32px] p-6 animate-in zoom-in-95 duration-300">
                        <div className="space-y-4">
                            <h3 className="font-black text-lg tracking-tight flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-500 shadow-inner">
                                    <Plus className="w-5 h-5" />
                                </div>
                                Nouvelle Catégorie
                            </h3>
                            <div className="space-y-3">
                                <Input
                                    placeholder="Nom (Ex: Matières Premières)"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="h-12 border-slate-200 dark:border-slate-800 rounded-2xl font-bold bg-slate-50 dark:bg-slate-950"
                                    autoFocus
                                />
                                <Select value={newType} onValueChange={setNewType}>
                                    <SelectTrigger className="h-12 border-slate-200 dark:border-slate-800 rounded-2xl font-bold bg-slate-50 dark:bg-slate-950">
                                        <SelectValue placeholder="Type de flux" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {categoryTypes.map(t => (
                                            <SelectItem key={t} value={t} className="rounded-xl font-bold">
                                                {TYPE_LABELS[t] || t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button className="flex-1 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 font-bold" onClick={handleCreate}>
                                    Créer la catégorie
                                </Button>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl" onClick={() => setIsCreating(false)}>
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div
                        onClick={() => setIsCreating(true)}
                        className="group flex flex-col items-center justify-center p-8 bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-500 min-h-[300px]"
                    >
                        <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-[20px] shadow-sm flex items-center justify-center text-slate-300 group-hover:text-emerald-500 group-hover:scale-110 transition-all mb-6">
                            <Plus className="w-8 h-8" />
                        </div>
                        <h3 className="font-black text-xl text-slate-800 dark:text-slate-200">Ajouter Catégorie</h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Mieux organiser vos comptes</p>
                    </div>
                )}
            </div>
        </div>
    )
}
