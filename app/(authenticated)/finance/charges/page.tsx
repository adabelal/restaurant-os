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
        <div className="flex flex-col min-h-screen bg-slate-50/50 space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-blue-600" />
                        Charges Fixes
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Planifiez vos décaissements récurrents pour un pilotage précis.
                    </p>
                </div>
                <div>
                    <AddFixedCostDialog initialCategories={categories} />
                </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-blue-100 shadow-sm border-l-4 border-l-blue-600">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <PieChart className="h-4 w-4" />
                            Total Mensuel Estimé
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalMonthly)}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Projection lissée sur l'année</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Nombre de Prélèvements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{charges.length}</div>
                        <p className="text-xs text-slate-500 mt-1">Contrats et abonnements actifs</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Échéancier</CardTitle>
                            <CardDescription>Visualisez et gérez vos sorties de cash automatiques.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[250px] pl-6">Libellé</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Fréquence</TableHead>
                                <TableHead>Échéance</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {charges.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-32 text-slate-400">
                                        Aucune charge configurée. Cliquez sur "Ajouter une charge" pour commencer.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                charges.map((charge) => (
                                    <TableRow key={charge.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-semibold text-slate-900 pl-6">
                                            {charge.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">
                                                {charge.category.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(charge.amount))}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 px-2 py-1 bg-slate-100 rounded">
                                                {charge.frequency === 'MONTHLY' && 'Mensuel'}
                                                {charge.frequency === 'QUARTERLY' && 'Trimestriel'}
                                                {charge.frequency === 'YEARLY' && 'Annuel'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar className="h-3 w-3" />
                                                <span>le {charge.dayOfMonth}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <form action={async () => {
                                                'use server'
                                                await deleteFixedCost(charge.id)
                                            }}>
                                                <Button size="icon" variant="ghost" className="text-slate-400 hover:text-red-600 hover:bg-red-50">
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
