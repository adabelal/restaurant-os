import { getFixedCosts, getFinanceCategories, deleteFixedCost } from "../actions"
import { AddFixedCostDialog } from "@/components/finance/AddFixedCostDialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Calendar, CreditCard, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function FinanceChargesPage() {
    const charges = await getFixedCosts()
    const categories = await getFinanceCategories()

    const totalMonthly = charges.reduce((acc, charge) => {
        const amount = Number(charge.amount)
        if (charge.frequency === 'MONTHLY') return acc + amount
        if (charge.frequency === 'QUARTERLY') return acc + (amount / 3)
        if (charge.frequency === 'YEARLY') return acc + (amount / 12)
        return acc
    }, 0)

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 space-y-6 md:space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header Section with Gradient */}
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 shadow-xl text-white">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                            <CreditCard className="h-8 w-8 text-blue-400" />
                            Charges Fixes
                        </h1>
                        <p className="mt-2 text-slate-400 font-medium max-w-xl text-lg">
                            Planifiez vos décaissements récurrents pour un pilotage précis de votre trésorerie.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <AddFixedCostDialog initialCategories={categories} />
                    </div>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-lg bg-white/70 backdrop-blur-sm ring-1 ring-slate-200/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <PieChart className="h-4 w-4 text-blue-600" />
                            Total Mensuel Estimé
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalMonthly)}
                        </div>
                        <p className="text-sm font-medium text-slate-400 mt-2">Projection lissée sur l'année</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-white/70 backdrop-blur-sm ring-1 ring-slate-200/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-emerald-600" />
                            Nombre de Prélèvements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{charges.length}</div>
                        <p className="text-sm font-medium text-slate-400 mt-2">Contrats et abonnements actifs</p>
                    </CardContent>
                </Card>

                {/* Decorative Insight Card */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CreditCard className="h-24 w-24" />
                    </div>
                    <CardContent className="flex flex-col justify-center h-full pt-6 relative z-10">
                        <p className="text-lg font-medium leading-relaxed opacity-90">
                            "Une gestion rigoureuse des charges fixes est la clé d'une rentabilité durable."
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden ring-1 ring-slate-200">
                <CardHeader className="border-b border-slate-100 p-8 bg-slate-50/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-900">Échéancier Détaillé</CardTitle>
                            <CardDescription className="text-slate-500 mt-1">Visualisez et gérez vos sorties de cash automatiques.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                                <TableHead className="w-[300px] pl-4 md:pl-8 py-5 text-xs uppercase font-bold text-slate-500 tracking-wider">Libellé</TableHead>
                                <TableHead className="hidden md:table-cell py-5 text-xs uppercase font-bold text-slate-500 tracking-wider">Catégorie</TableHead>
                                <TableHead className="py-5 text-xs uppercase font-bold text-slate-500 tracking-wider">Montant</TableHead>
                                <TableHead className="hidden sm:table-cell py-5 text-xs uppercase font-bold text-slate-500 tracking-wider">Fréquence</TableHead>
                                <TableHead className="hidden lg:table-cell py-5 text-xs uppercase font-bold text-slate-500 tracking-wider">Jour</TableHead>
                                <TableHead className="text-right pr-8 py-5 text-xs uppercase font-bold text-slate-500 tracking-wider">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {charges.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-48 text-slate-400 bg-slate-50/20">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <CreditCard className="h-8 w-8 opacity-20" />
                                            <p>Aucune charge configurée.</p>
                                            <p className="text-xs">Cliquez sur "Ajouter une charge" pour commencer.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                charges.map((charge) => (
                                    <TableRow key={charge.id} className="hover:bg-blue-50/30 transition-colors group border-b border-slate-50">
                                        <TableCell className="font-semibold text-slate-900 pl-4 md:pl-8 py-6">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                <span className="truncate max-w-[120px] sm:max-w-none">{charge.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant="secondary" className="font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 group-hover:bg-white transition-colors">
                                                {charge.category?.name || 'Non catégorisé'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-900 text-sm md:text-base">
                                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(charge.amount))}
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${charge.frequency === 'MONTHLY' ? 'bg-emerald-100 text-emerald-700' :
                                                charge.frequency === 'QUARTERLY' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-purple-100 text-purple-700'
                                                }`}>
                                                {charge.frequency === 'MONTHLY' && 'Mensuel'}
                                                {charge.frequency === 'QUARTERLY' && 'Trimestriel'}
                                                {charge.frequency === 'YEARLY' && 'Annuel'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-center gap-2 text-slate-500 font-medium">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                <span>le {charge.dayOfMonth}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <form action={async () => {
                                                'use server'
                                                await deleteFixedCost(charge.id)
                                            }}>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
