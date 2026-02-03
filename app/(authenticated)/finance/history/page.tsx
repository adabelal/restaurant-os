import { Search, ArrowLeft, ArrowUpRight, ArrowDownRight, Wallet, Calendar, Filter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getBankTransactions } from "../actions"

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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/finance">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white shadow-sm border border-slate-200">
                            <ArrowLeft className="h-5 w-5 text-slate-600" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Grand Livre de Compte</h1>
                        <p className="text-slate-500 font-medium">{totalCount} transactions trouvées</p>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardContent className="p-6">
                    <form className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                name="q"
                                defaultValue={query}
                                placeholder="Rechercher une transaction (ex: Metro, Urssaf, Loyer...)"
                                className="pl-12 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-sky-500 font-medium"
                            />
                        </div>
                        <Button type="submit" className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 transition-all font-bold">
                            Rechercher
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Libellé / Description</th>
                                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Catégorie</th>
                                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Montant</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center">
                                                <Search className="h-12 w-12 mb-4 opacity-10" />
                                                <p className="text-lg">Aucune transaction ne correspond à votre recherche.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">
                                                        {t.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-black">
                                                        {t.date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${Number(t.amount) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        {Number(t.amount) >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                                    </div>
                                                    <p className="font-medium text-slate-800 line-clamp-1">{t.description}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                {t.category ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100">
                                                        {t.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 text-xs italic">Non classé</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`text-lg font-black ${Number(t.amount) >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                    {Number(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
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
                                className={`h-10 w-10 p-0 rounded-xl font-bold ${page === i + 1 ? 'bg-slate-900' : 'bg-white border-slate-200'}`}
                            >
                                {i + 1}
                            </Button>
                        </Link>
                    ))}
                    {totalPages > 5 && <span className="flex items-center px-2 text-slate-400">...</span>}
                    {totalPages > 5 && (
                        <Link href={`/finance/history?q=${query}&page=${totalPages}`}>
                            <Button variant={page === totalPages ? "default" : "outline"} className="h-10 w-10 p-0 rounded-xl font-bold">
                                {totalPages}
                            </Button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
