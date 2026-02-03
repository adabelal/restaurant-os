export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, ShoppingCart, TrendingUp, ArrowUpRight, Plus, ScanLine } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
    const userCount = await prisma.user.count()
    const ingredientCount = await prisma.ingredient.count()

    return (
        <main className="flex flex-col p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                        Tableau de Bord
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">
                        Bienvenue ! Voici l'activité de votre restaurant aujourd'hui.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-full px-6 border-2 hover:bg-muted font-semibold transition-all active:scale-95" asChild>
                        <Link href="/achats/scanner">
                            <ScanLine className="mr-2 h-4 w-4" />
                            Scanner Facture
                        </Link>
                    </Button>
                    <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 font-semibold transition-all active:scale-95" asChild>
                        <Link href="/stock">
                            <Plus className="mr-2 h-4 w-4" />
                            Nouvelle Entrée
                        </Link>
                    </Button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                <Card className="group relative overflow-hidden border-none shadow-xl shadow-blue-500/5 bg-card/60 backdrop-blur-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="h-24 w-24 -mr-8 -mt-8" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Effectif Total</CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex items-baseline gap-2">
                            <div className="text-4xl font-black text-foreground">{userCount}</div>
                            <span className="text-sm font-medium text-emerald-500 flex items-center">
                                +2 <ArrowUpRight className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 font-medium">Collaborateurs actifs sur site</p>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>

                <Card className="group relative overflow-hidden border-none shadow-xl shadow-emerald-500/5 bg-card/60 backdrop-blur-sm hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Package className="h-24 w-24 -mr-8 -mt-8" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Stock Références</CardTitle>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex items-baseline gap-2">
                            <div className="text-4xl font-black text-foreground">{ingredientCount}</div>
                            <span className="text-sm font-medium text-rose-500 flex items-center">
                                -5 <ArrowUpRight className="h-4 w-4 rotate-180" />
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 font-medium">Produits en base de données</p>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>

                <Card className="group relative overflow-hidden border-none shadow-xl shadow-indigo-500/5 bg-card/60 backdrop-blur-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-24 w-24 -mr-8 -mt-8" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Chiffre d'Affaires</CardTitle>
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex items-baseline gap-2">
                            <div className="text-4xl font-black text-foreground">--</div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 font-medium">Données en cours d'intégration</p>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>
            </div>

            {/* Quick Actions Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">Accès Rapide</h2>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Voir tout</Button>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                    <Link href="/stock" className="group block h-full">
                        <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/40 p-1 transition-all group-hover:border-emerald-500/30 group-hover:shadow-2xl group-hover:shadow-emerald-500/10 h-full">
                            <div className="relative z-10 p-6 flex flex-col h-full bg-background/40 group-hover:bg-emerald-50/5 dark:group-hover:bg-emerald-950/20 rounded-[calc(1.5rem-1px)] transition-colors">
                                <div className="h-14 w-14 bg-emerald-500/10 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Package className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Gérer l'Inventaire</h3>
                                <p className="text-muted-foreground leading-relaxed font-medium">Contrôlez vos stocks en temps réel, gérez les alertes et optimisez vos commandes fournisseurs.</p>
                                <div className="mt-auto pt-6 flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Accéder maintenant <ChevronRight className="ml-1 h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/rh" className="group block h-full">
                        <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/40 p-1 transition-all group-hover:border-blue-500/30 group-hover:shadow-2xl group-hover:shadow-blue-500/10 h-full">
                            <div className="relative z-10 p-6 flex flex-col h-full bg-background/40 group-hover:bg-blue-50/5 dark:group-hover:bg-blue-950/20 rounded-[calc(1.5rem-1px)] transition-colors">
                                <div className="h-14 w-14 bg-blue-500/10 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Users className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Gérer l'Équipe</h3>
                                <p className="text-muted-foreground leading-relaxed font-medium">Suivez les feuilles de présence, gérez les contrats et planifiez les sessions de formation.</p>
                                <div className="mt-auto pt-6 flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Accéder au portail RH <ChevronRight className="ml-1 h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </main>
    )
}

function ChevronRight({ className, ...props }: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}
