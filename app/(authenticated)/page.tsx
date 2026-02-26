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
        <main className="flex flex-col min-h-screen p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-sans transition-colors duration-300">
            {/* 1. HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="space-y-1">
                    <p className="text-sm font-oswald text-primary uppercase tracking-widest font-bold">Aperçu</p>
                    <h1 className="text-4xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        Tableau de Bord
                    </h1>
                    <p className="text-muted-foreground font-medium first-letter:uppercase">{todayDate}</p>
                </div>
                <div className="flex gap-3">
                    <Button asChild variant="outline" className="font-semibold shadow-sm hover:shadow-md transition-shadow h-11 px-6 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm">
                        <Link href="/achats/scanner">
                            <ScanLine className="mr-2 h-4 w-4" /> Scanner
                        </Link>
                    </Button>
                    <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 h-11 px-6 rounded-xl">
                        <Link href="/caisse">
                            <Plus className="mr-2 h-5 w-5" /> Nouvelle Vente
                        </Link>
                    </Button>
                </div>
            </div>

            {/* 2. KPI: LES CHIFFRES CLÉS DU JOUR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* RECETTE DU JOUR */}
                <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-background to-emerald-500/5 dark:to-emerald-500/10 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 relative group animate-in slide-in-from-bottom-6 fade-in duration-700 delay-100 fill-mode-both">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recette du Jour</CardTitle>
                        <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                            <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                            {dailyRevenue > 0 ? '+' : ''}{dailyRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 font-medium">Entrées Caisse aujourd'hui</p>
                    </CardContent>
                </Card>

                {/* TRÉSORERIE TOTALE */}
                <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-background to-primary/5 dark:to-primary/10 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 relative group animate-in slide-in-from-bottom-6 fade-in duration-700 delay-200 fill-mode-both">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Trésorerie Totale</CardTitle>
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black tracking-tight text-foreground">
                            {totalTreasury.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 font-medium">Banque + Caisse consolidés</p>
                    </CardContent>
                </Card>

                {/* FACTURES À PAYER */}
                <Link href="/achats" className="block outline-none animate-in slide-in-from-bottom-6 fade-in duration-700 delay-300 fill-mode-both">
                    <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-background to-amber-500/5 dark:to-amber-500/10 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 relative group h-full">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Factures en Attente</CardTitle>
                            <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black tracking-tight text-amber-600 dark:text-amber-400">
                                {pendingInvoicesCount}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 font-medium group-hover:text-amber-600/70 dark:group-hover:text-amber-400/70 transition-colors">Documents à traiter dans les achats</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* 3. ACTIVITÉ RÉCENTE & ACCÈS RAPIDES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                {/* COLONNE GAUCHE (2/3) : ACTIVITÉ */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-0 shadow-lg shadow-black/5 bg-background rounded-2xl overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-700 delay-[400ms] fill-mode-both ring-1 ring-border/50">
                        <CardHeader className="border-b border-border/40 px-6 py-5 flex flex-row items-center justify-between bg-muted/10">
                            <div>
                                <CardTitle className="text-xl font-bold text-foreground">Activités Récentes</CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">Derniers mouvements synchronisés</p>
                            </div>
                            <Button variant="ghost" size="sm" className="text-sm font-semibold text-primary hover:bg-primary/10" asChild>
                                <Link href="/finance">Voir Tout <ArrowRight className="w-4 h-4 ml-1" /></Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/40">
                                {recentActivity.length === 0 ? (
                                    <div className="p-12 flex flex-col items-center justify-center text-center">
                                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                            <CalendarDays className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">Aucune activité récente.</p>
                                        <p className="text-xs text-muted-foreground mt-1">Les mouvements apparaîtront ici.</p>
                                    </div>
                                ) : (
                                    recentActivity.map((t) => (
                                        <div key={t.id} className="group flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-5">
                                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm ${Number(t.amount) >= 0
                                                    ? 'bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-slate-100/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                    {Number(t.amount) >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground text-sm md:text-base truncate max-w-[180px] sm:max-w-xs md:max-w-md group-hover:text-primary transition-colors">{t.description}</p>
                                                    <p className="text-xs font-medium text-muted-foreground mt-0.5">{new Date(t.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                                                </div>
                                            </div>
                                            <div className={`text-base md:text-lg font-black tracking-tight ${Number(t.amount) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
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
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2 animate-in fade-in duration-700 delay-500 fill-mode-both">Modules Accessibles</h3>

                    <Link href="/finance" className="block group outline-none animate-in slide-in-from-bottom-4 fade-in duration-700 delay-[550ms] fill-mode-both">
                        <Card className="border-0 shadow-md shadow-black/5 bg-background rounded-2xl p-5 hover:ring-2 hover:ring-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-inner">
                                <Wallet className="h-7 w-7" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">Finance</h4>
                                <p className="text-xs text-muted-foreground font-medium">Trésorerie, Charges</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        </Card>
                    </Link>

                    <Link href="/rh" className="block group outline-none animate-in slide-in-from-bottom-4 fade-in duration-700 delay-[600ms] fill-mode-both">
                        <Card className="border-0 shadow-md shadow-black/5 bg-background rounded-2xl p-5 hover:ring-2 hover:ring-blue-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
                                <Users className="h-7 w-7" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-foreground text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Équipe</h4>
                                <p className="text-xs text-muted-foreground font-medium">{employeeCount} collaborateurs</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            </div>
                        </Card>
                    </Link>

                    <Link href="/achats" className="block group outline-none animate-in slide-in-from-bottom-4 fade-in duration-700 delay-[650ms] fill-mode-both">
                        <Card className="border-0 shadow-md shadow-black/5 bg-background rounded-2xl p-5 hover:ring-2 hover:ring-amber-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-inner">
                                <ScanLine className="h-7 w-7" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-foreground text-lg group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Achats</h4>
                                <p className="text-xs text-muted-foreground font-medium">Fournisseurs, Stocks</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                            </div>
                        </Card>
                    </Link>
                </div>
            </div>
        </main>
    )
}
