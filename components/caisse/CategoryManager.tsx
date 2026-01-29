'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Tag, ArrowUpCircle, ArrowDownCircle, Trash2, Settings2 } from "lucide-react"
import { createCashCategory, deleteCashCategory } from "@/app/caisse/actions"
import { toast } from "sonner"
// import type { CashTransactionType } from "@prisma/client"
type CashTransactionType = 'IN' | 'OUT'

interface CategoryManagerProps {
    initialCategories: any[]
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
    const [name, setName] = useState('')
    const [type, setType] = useState<CashTransactionType>('OUT')

    async function handleAddCategory(e: React.FormEvent) {
        e.preventDefault()
        if (!name) return
        await createCashCategory(name, type)
        setName('')
    }

    const catsIn = initialCategories.filter(c => c.type === 'IN')
    const catsOut = initialCategories.filter(c => c.type === 'OUT')

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="md:col-span-1 border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="h-5 w-5 text-blue-500" /> Nouvelle Catégorie
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="catName">Nom de la catégorie</Label>
                            <Input
                                id="catName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Achats Boissons, Loyers..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <div className="flex p-1 bg-muted rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setType('OUT')}
                                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${type === 'OUT' ? 'bg-background shadow text-rose-600' : 'text-muted-foreground'}`}
                                >
                                    SORTIE
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('IN')}
                                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${type === 'IN' ? 'bg-background shadow text-emerald-600' : 'text-muted-foreground'}`}
                                >
                                    ENTRÉE
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                            Ajouter
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="md:col-span-2 border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-blue-500" /> Catégories Existantes
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-rose-600 mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <ArrowDownCircle className="h-4 w-4" /> Dépenses (Sorties)
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {catsOut.map(cat => (
                                <Badge key={cat.id} variant="secondary" className="px-3 py-1.5 gap-2 group hover:bg-rose-50 dark:hover:bg-rose-900/10">
                                    <Tag className="h-3 w-3 text-rose-500" />
                                    {cat.name}
                                    <button
                                        onClick={async () => {
                                            if (confirm(`Supprimer la catégorie "${cat.name}" ?`)) {
                                                try {
                                                    await deleteCashCategory(cat.id)
                                                    toast.success("Catégorie supprimée")
                                                } catch (e) {
                                                    toast.error("Impossible de supprimer cette catégorie car des transactions y sont liées.")
                                                }
                                            }
                                        }}
                                        className="hidden group-hover:block ml-1 text-muted-foreground hover:text-rose-600"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-dashed">
                        <h3 className="text-sm font-bold text-emerald-600 mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <ArrowUpCircle className="h-4 w-4" /> Recettes (Entrées)
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {catsIn.map(cat => (
                                <Badge key={cat.id} variant="secondary" className="px-3 py-1.5 gap-2 group hover:bg-emerald-50 dark:hover:bg-emerald-900/10">
                                    <Tag className="h-3 w-3 text-emerald-500" />
                                    {cat.name}
                                    <button
                                        onClick={async () => {
                                            if (confirm(`Supprimer la catégorie "${cat.name}" ?`)) {
                                                try {
                                                    await deleteCashCategory(cat.id)
                                                    toast.success("Catégorie supprimée")
                                                } catch (e) {
                                                    toast.error("Impossible de supprimer cette catégorie car des transactions y sont liées.")
                                                }
                                            }
                                        }}
                                        className="hidden group-hover:block ml-1 text-muted-foreground hover:text-emerald-600"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
