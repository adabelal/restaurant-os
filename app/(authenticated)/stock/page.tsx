import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreateIngredientDialog } from "@/components/stock/CreateIngredientDialog"
import { EditIngredientDialog } from "@/components/stock/EditIngredientDialog"
import { deleteIngredient } from "./actions"
import { toast } from "sonner"
import { Package, AlertTriangle, Archive, Search, Filter } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function StockPage() {
    const ingredients = await prisma.ingredient.findMany({
        orderBy: { name: 'asc' }
    })

    const lowStockCount = ingredients.filter(i => Number(i.currentStock) <= Number(i.minStock)).length

    return (
        <main className="flex min-h-screen flex-col bg-[#faf9f6]">
            {/* Premium Emerald Header */}
            <div className="w-full bg-gradient-to-r from-[#064e3b] to-[#065f46] px-10 py-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-amber-500/10 blur-[80px]" />
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10 text-white">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-400/20 rounded-xl backdrop-blur-md">
                                <Package className="h-6 w-6 text-amber-400" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Économat & Stocks</h1>
                        </div>
                        <p className="text-emerald-100/70 font-medium">Gestion intelligente de vos matières premières et alertes ruptures.</p>
                    </div>
                    <CreateIngredientDialog />
                </div>

                {/* Stats Bar Floating */}
                <div className="max-w-7xl mx-auto mt-10 flex flex-wrap gap-4 relative z-10">
                    <div className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10 flex items-center gap-3 shadow-xl shadow-black/10 transition-transform hover:scale-105">
                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        {lowStockCount} produits en alerte
                    </div>
                    <div className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10 flex items-center gap-3 shadow-xl shadow-black/10 transition-transform hover:scale-105">
                        <Archive className="h-4 w-4 text-emerald-300" />
                        {ingredients.length} références actives
                    </div>
                </div>
            </div>

            <div className="flex-1 px-8 py-10 max-w-7xl mx-auto w-full space-y-8">
                {/* Search & Filter Mock Bar */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-900/30" />
                        <input
                            placeholder="Rechercher un ingrédient..."
                            className="w-full h-12 pl-12 pr-4 bg-white border-none ring-1 ring-emerald-900/5 rounded-2xl shadow-sm focus:ring-emerald-500/20 font-medium text-emerald-900 outline-none transition-all"
                        />
                    </div>
                    <Button variant="outline" className="h-12 px-6 rounded-2xl bg-white border-none ring-1 ring-emerald-900/5 shadow-sm text-emerald-900/60 font-black uppercase tracking-widest flex items-center gap-2">
                        <Filter className="h-4 w-4" /> Filtres
                    </Button>
                </div>

                <div className="rounded-[2rem] shadow-2xl bg-white overflow-hidden ring-1 ring-emerald-900/5">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-[#064e3b]/5 text-[#064e3b] text-[10px] font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-6">Ingrédient</th>
                                <th className="px-8 py-6">Catégorie</th>
                                <th className="px-8 py-6">Stock Actuel</th>
                                <th className="px-8 py-6 text-right">Contrôle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-900/5">
                            {ingredients.map((item) => {
                                const isLow = Number(item.currentStock) <= Number(item.minStock);
                                return (
                                    <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-800 text-base uppercase tracking-tight group-hover:text-emerald-700 transition-colors">{item.name}</p>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <Badge variant="outline" className="bg-slate-50 border-emerald-900/10 text-emerald-900/50 font-black text-[9px] uppercase tracking-widest px-3">
                                                {item.category}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xl font-black tracking-tight ${isLow ? 'text-rose-600' : 'text-[#064e3b]'}`}>
                                                    {Number(item.currentStock)}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                                                    {item.unit}
                                                </span>
                                                {isLow && (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg animate-pulse">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        <span className="text-[9px] font-black uppercase tracking-tighter">Réappro</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-rose-500' : 'bg-emerald-600'}`}
                                                    style={{ width: `${Math.min(100, (Number(item.currentStock) / (Number(item.minStock) * 3)) * 100)}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                                        <span className="sr-only">Supprimer</span>
                                                        <AlertTriangle className="h-4 w-4" />
                                                    </Button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {ingredients.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-20 w-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center">
                                                <Package className="h-10 w-10 text-emerald-100" />
                                            </div>
                                            <p className="text-emerald-900/30 text-sm font-black uppercase tracking-[0.2em] italic">Votre stock est vide</p>
                                        </div>
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
