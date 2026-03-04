'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
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
            } else if (res?.data) {
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
            } else if (res?.data) {
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
        <div className="space-y-6">
            <Card className="bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900 p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-indigo-800 dark:text-indigo-300">Vos catégories</h2>
                        <p className="text-sm text-indigo-600/80 dark:text-indigo-400/80">
                            Elles serviront directement à analyser vos dépenses dans le dashboard.
                        </p>
                    </div>
                    {!isCreating ? (
                        <Button onClick={() => setIsCreating(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Nouvelle Catégorie
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 bg-background p-2 pr-2 rounded-xl border shadow-sm w-full md:w-auto">
                            <Input
                                placeholder="Nom (Ex: Essence)"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="border-0 focus-visible:ring-0 w-32 md:w-48"
                                autoFocus
                            />
                            <Select value={newType} onValueChange={setNewType}>
                                <SelectTrigger className="border-0 ring-0 focus:ring-0 outline-none w-[160px] bg-transparent">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryTypes.map(t => (
                                        <SelectItem key={t} value={t}>{TYPE_LABELS[t] || t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button size="icon" variant="ghost" onClick={handleCreate} disabled={isLoading} className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50">
                                <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setIsCreating(false)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(grouped).map(([type, cats]) => (
                    <Card key={type} className="shadow-sm border-border bg-card overflow-hidden flex flex-col">
                        <div className="p-3 bg-muted/40 border-b border-border font-semibold text-sm flex justify-between items-center">
                            <span>{TYPE_LABELS[type] || type}</span>
                            <Badge variant="secondary" className="text-xs bg-background">{cats.length}</Badge>
                        </div>
                        <div className="p-2 space-y-1 flex-1">
                            {cats.map(cat => (
                                <div key={cat.id} className="group p-2 flex items-center justify-between rounded-lg hover:bg-muted text-sm transition-colors">
                                    {editingId === cat.id ? (
                                        <div className="flex items-center gap-2 w-full">
                                            <Input
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                className="h-8 text-sm"
                                                autoFocus
                                            />
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={handleUpdate} disabled={isLoading}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500" onClick={() => setEditingId(null)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="font-medium truncate pr-2 flex-1 flex items-center gap-2">
                                                {cat.name}
                                                {cat.transactionCount > 0 && (
                                                    <span className="text-[10px] text-muted-foreground bg-muted-foreground/10 px-1.5 py-0.5 rounded-sm" title={`${cat.transactionCount} transactions liées`}>
                                                        {cat.transactionCount} tx
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-500" onClick={() => startEdit(cat)}>
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-rose-500 disabled:opacity-30 disabled:hover:bg-transparent"
                                                    disabled={cat.transactionCount > 0 || cat.fixedCostCount > 0 || isLoading}
                                                    onClick={() => handleDelete(cat.id, cat.transactionCount + cat.fixedCostCount)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
