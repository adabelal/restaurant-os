export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, ShoppingCart, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
    const userCount = await prisma.user.count()
    const ingredientCount = await prisma.ingredient.count()
    // const lowStockCount = await prisma.ingredient.count({ where: { currentStock: { lte: prisma.ingredient.fields.minStock } } }) // Requete complexe, on simplifie pour la v1

    return (
        <main className="flex min-h-screen flex-col bg-background p-8 md:p-12 transition-colors">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Tableau de Bord</h1>
                <p className="text-muted-foreground">Vue d'ensemble de votre restaurant aujourd'hui.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="border-none shadow-sm bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Effectif Total</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userCount}</div>
                        <p className="text-xs text-muted-foreground">Collaborateurs actifs</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Stock Références</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ingredientCount}</div>
                        <p className="text-xs text-muted-foreground">Produits en base</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Service du Jour</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">Chiffre d'Affaires (bientôt)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions Grid */}
            <h2 className="text-xl font-semibold mb-4 text-foreground/80">Accès Rapide</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/stock" className="group">
                    <div className="rounded-xl border bg-card p-6 h-full hover:shadow-md transition-all group-hover:border-emerald-500/30 group-hover:bg-emerald-50/5 dark:group-hover:bg-emerald-950/10">
                        <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                            <Package className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-foreground">Gérer l'Inventaire</h3>
                        <p className="text-sm text-muted-foreground mt-1">Faire une entrée de stock ou un inventaire.</p>
                    </div>
                </Link>

                <Link href="/rh" className="group">
                    <div className="rounded-xl border bg-card p-6 h-full hover:shadow-md transition-all group-hover:border-blue-500/30 group-hover:bg-blue-50/5 dark:group-hover:bg-blue-950/10">
                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                            <Users className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-foreground">Gérer l'Équipe</h3>
                        <p className="text-sm text-muted-foreground mt-1">Ajouter un extra ou voir le planning.</p>
                    </div>
                </Link>
            </div>
        </main>
    )
}
