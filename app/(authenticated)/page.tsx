
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    LayoutDashboard,
    Banknote,
    Wallet,
    AlertCircle,
    ScanLine,
    Plus,
    Users,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
    CalendarDays
} from "lucide-react"
import Link from "next/link"
import { getDashboardStats } from "./dashboard.actions"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const {
        dailyRevenue,
        totalTreasury,
        pendingInvoicesCount,
        recentActivity,
        employeeCount
    } = await getDashboardStats()

    const todayDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

    return (
        <main className="flex flex-col min-h-screen bg-background p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans transition-colors duration-300">

            {/* 1. HEADER SIMPLE & EFFICACE */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <LayoutDashboard className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        Tableau de Bord
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1 first-letter:uppercase">{todayDate}</p>
                </div>
                <div className="flex gap-3">
                    <Button asChild variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm dark:bg-indigo-600 dark:hover:bg-indigo-500">
                        <Link href="/achats/scanner">
                            <ScanLine className="mr-2 h-4 w-4" /> Scanner Facture
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="font-semibold border-border text-foreground hover:bg-muted">
                        <Link href="/caisse">
                            <Plus className="mr-2 h-4 w-4" /> Nouvelle Vente
                        </Link>
                    </Button>
                </div>
            </div>

            {/* 2. KPI: LES CHIFFRES CLÉS DU JOUR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* RECETTE DU JOUR */}
                <Card className="border border-border shadow-sm bg-card rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recette du Jour</CardTitle>
                        <Banknote className="h-5 w-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                            {dailyRevenue > 0 ? '+' : ''}{dailyRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">Entrées Caisse aujourd'hui</p>
                    </CardContent>
                </Card>

                {/* TRÉSORERIE TOTALE */}
                <Card className="border border-border shadow-sm bg-card rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Trésorerie Totale</CardTitle>
                        <Wallet className="h-5 w-5 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                            {totalTreasury.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">Banque + Caisse consolidés</p>
                    </CardContent>
                </Card>

                {/* FACTURES À PAYER */}
                <Card className="border border-border shadow-sm bg-card rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group hover:border-amber-500/30">
                    <Link href="/achats">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Factures en Attente</CardTitle>
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                                {pendingInvoicesCount}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium group-hover:text-amber-600/70 dark:group-hover:text-amber-400/70 transition-colors">Documents à traiter</p>
                        </CardContent>
                    </Link>
                </Card>
            </div>

            {/* 3. ACTIVITÉ RÉCENTE & ACCÈS RAPIDES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* COLONNE GAUCHE (2/3) : ACTIVITÉ */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border border-border shadow-sm bg-card rounded-xl overflow-hidden">
                        <CardHeader className="border-b border-border bg-muted/30 px-6 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-foreground">Activités Récentes</CardTitle>
                            <Button variant="ghost" size="sm" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400" asChild>
                                <Link href="/finance">Voir Tout</Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {recentActivity.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm italic">Aucune activité récente.</div>
                                ) : (
                                    recentActivity.map((t) => (
                                        <div key={t.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${Number(t.amount) >= 0
                                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                    {Number(t.amount) >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground text-sm truncate max-w-[200px] sm:max-w-md">{t.description}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('fr-FR')}</p>
                                                </div>
                                            </div>
                                            <div className={`text-sm font-bold ${Number(t.amount) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                                                {Number(t.amount) > 0 ? '+' : ''}{Number(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* COLONNE DROITE (1/3) : MODULES */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Modules</h3>

                    <Link href="/finance" className="block group">
                        <Card className="border border-border shadow-sm bg-card rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">Finance & Pilotage</h4>
                                <p className="text-xs text-muted-foreground">Trésorerie, Charges, Banque</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-border ml-auto group-hover:text-indigo-400 transition-colors" />
                        </Card>
                    </Link>

                    <Link href="/rh" className="block group">
                        <Card className="border border-border shadow-sm bg-card rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">RH & Équipe</h4>
                                <p className="text-xs text-muted-foreground">{employeeCount} collaborateurs actifs</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-border ml-auto group-hover:text-blue-400 transition-colors" />
                        </Card>
                    </Link>

                    <Link href="/achats" className="block group">
                        <Card className="border border-border shadow-sm bg-card rounded-xl p-4 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <ScanLine className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">Achats & Factures</h4>
                                <p className="text-xs text-muted-foreground">Fournisseurs, Stocks, Scans</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-border ml-auto group-hover:text-amber-400 transition-colors" />
                        </Card>
                    </Link>
                </div>
            </div>
        </main>
    )
}
