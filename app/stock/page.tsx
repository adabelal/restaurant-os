export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateIngredientDialog } from "@/components/stock/CreateIngredientDialog"
import { EditIngredientDialog } from "@/components/stock/EditIngredientDialog"
import { deleteIngredient } from "./actions"
import { toast } from "sonner"

export default async function StockPage() {
    const ingredients = await prisma.ingredient.findMany({
        orderBy: { name: 'asc' }
    })

    // Calculs rapides
    const lowStockCount = ingredients.filter(i => Number(i.currentStock) <= Number(i.minStock)).length
    const totalValue = 0 // A calculer plus tard si prix renseigné

    return (
        <main className="flex min-h-screen flex-col bg-gray-50/30">

            {/* Header */}
            <div className="w-full bg-white border-b px-8 py-8">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Economat & Stock</h1>
                        <p className="text-slate-500">Suivi des ingrédients en temps réel.</p>
                    </div>
                    <CreateIngredientDialog />
                </div>

                {/* Stats Bar */}
                <div className="max-w-6xl mx-auto mt-6 flex gap-4">
                    <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
                        ⚠️ {lowStockCount} produits en rupture ou alerte
                    </div>
                    <div className="bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-100">
                        📦 {ingredients.length} références totales
                    </div>
                </div>
            </div>

            <div className="flex-1 px-8 py-8 max-w-6xl mx-auto w-full">
                <div className="rounded-md border bg-white">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Nom</th>
                                <th className="px-6 py-4 font-medium">Catégorie</th>
                                <th className="px-6 py-4 font-medium">Stock</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {ingredients.map((item) => {
                                const isLow = Number(item.currentStock) <= Number(item.minStock);
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline">{item.category}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-700'}`}>
                                                {Number(item.currentStock)} {item.unit}
                                            </span>
                                            {isLow && <span className="ml-2 text-xs text-red-500">(Bas)</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center gap-2">
                                                <EditIngredientDialog
                                                    ingredient={{
                                                        ...item,
                                                        currentStock: Number(item.currentStock),
                                                        minStock: Number(item.minStock),
                                                        pricePerUnit: Number(item.pricePerUnit),
                                                    }}
                                                />
                                                <form action={async (formData: FormData) => {
                                                    const res = await deleteIngredient(formData);
                                                    if (res.success) {
                                                        toast.success(res.message);
                                                    } else {
                                                        toast.error(res.message);
                                                    }
                                                }}>
                                                    <input type="hidden" name="id" value={item.id} />
                                                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 text-xs">Supprimer</Button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {ingredients.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                        Aucun ingrédient. Ajoutez votre premier produit !
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    )
}
