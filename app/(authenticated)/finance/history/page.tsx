import { Search, ArrowLeft, ArrowUpRight, ArrowDownRight, Database, BookOpen } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { getBankTransactions } from "../actions"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function FinanceHistoryPage({
    searchParams
}: {
    searchParams: { q?: string, page?: string }
}) {
    const query = searchParams.q || ""
    const page = parseInt(searchParams.page || "1")

    const { transactions, totalPages, totalCount } = await getBankTransactions({
        search: query,
        page: page,
        limit: 50
    })

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 shadow-xl text-white">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <Link href="/finance" className="inline-flex items-center text-slate-400 hover:text-white mb-2 text-sm font-medium transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour au pilotage
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
                            <BookOpen className="h-8 w-8 text-blue-400" />
                            Grand Livre
                        </h1>
                        <p className="mt-2 text-slate-400 font-medium max-w-xl text-lg">
                            L'historique complet et inaltérable de vos flux bancaires.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <Database className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">{totalCount}</span>
                        <span className="text-slate-400 text-sm">transactions indexées</span>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden ring-1 ring-slate-100">
                <CardContent className="p-6">
                    <form className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                name="q"
                                defaultValue={query}
                                placeholder="Rechercher (ex: Metro, Urssaf, Loyer...)"
                                className="pl-14 h-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 font-medium text-lg placeholder:text-slate-400 transition-all focus:bg-white"
                            />
                        </div>
                        <Button type="submit" className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 transition-all font-bold text-lg shadow-lg shadow-slate-900/10">
                            Rechercher
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden ring-1 ring-slate-100">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-6 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                                    <th className="px-8 py-6 text-xs font-bold uppercase tracking-wider text-slate-500">Libellé</th>
                                    <th className="px-8 py-6 text-xs font-bold uppercase tracking-wider text-slate-500">Catégorie</th>
                                    <th className="px-8 py-6 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Montant</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-32 text-center text-slate-400">
                                            <div className="flex flex-col items-center">
                                                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                                    <Search className="h-10 w-10 opacity-20" />
                                                </div>
                                                <p className="text-xl font-medium text-slate-900">Aucune transaction trouvée</p>
                                                <p className="text-slate-500 mt-1">Essayez de modifier vos termes de recherche.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-base">
                                                        {t.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-1">
                                                        {t.date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2.5 rounded-xl ${Number(t.amount) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {Number(t.amount) >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                                    </div>
                                                    <p className="font-semibold text-slate-700 max-w-md truncate text-base">{t.description}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {t.category ? (
                                                    <Badge variant="secondary" className="px-3 py-1 text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-white transition-colors">
                                                        {t.category.name}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-slate-300 text-xs italic border-slate-200">
                                                        Non classé
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`text-lg font-black tracking-tight ${Number(t.amount) >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                    {Number(t.amount) > 0 ? '+' : ''}{Number(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pb-10">
                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                        <Link key={i} href={`/finance/history?q=${query}&page=${i + 1}`}>
                            <Button
                                variant={page === i + 1 ? "default" : "outline"}
                                className={`h-12 w-12 p-0 rounded-xl font-bold text-base transition-all ${page === i + 1 ? 'bg-slate-900 shadow-lg shadow-slate-900/20 scale-110' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                            >
                                {i + 1}
                            </Button>
                        </Link>
                    ))}
                    {totalPages > 5 && <span className="flex items-center px-4 text-slate-300 font-black text-xl">...</span>}
                    {totalPages > 5 && (
                        <Link href={`/finance/history?q=${query}&page=${totalPages}`}>
                            <Button variant={page === totalPages ? "default" : "outline"} className="h-12 w-12 p-0 rounded-xl font-bold bg-white border-slate-200 hover:bg-slate-50">
                                {totalPages}
                            </Button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
