
import { prisma } from "@/lib/prisma"
export const dynamic = 'force-dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, ArrowUpCircle, ArrowDownCircle, Settings, Calculator, TrendingUp } from "lucide-react"
import { AddTransactionDialog } from "@/components/caisse/AddTransactionDialog"
import { CaisseStats } from "@/components/caisse/CaisseStats"
import { MonthlyTransactionList } from "@/components/caisse/MonthlyTransactionList"
import { ExportDialog } from "@/components/caisse/ExportDialog"
import { CaisseConfig } from "@/components/caisse/CaisseConfig"
import { getAppSettings } from "@/app/caisse/actions"
import { ImportPopinaButton } from "@/components/caisse/ImportPopinaButton"

export default async function CaissePage() {
    // Fetch initial data
    const transactions = await prisma.cashTransaction.findMany({
        orderBy: { date: 'desc' },
        include: {
            category: true,
            user: { select: { name: true } }
        }
    })

    const categories = await prisma.cashCategory.findMany({
        orderBy: { name: 'asc' }
    })

    const settings = await getAppSettings()

    const entrees = transactions.filter((t: any) => t.type === 'IN')
    const sorties = transactions.filter((t: any) => t.type === 'OUT')

    // Calculate quick stats
    const totalIn = transactions
        .filter((t: any) => Number(t.amount) > 0)
        .reduce((acc: number, t: any) => acc + Number(t.amount), 0)

    const totalOut = transactions
        .filter((t: any) => Number(t.amount) < 0)
        .reduce((acc: number, t: any) => acc + Number(t.amount), 0)

    const balance = totalIn + totalOut

    return (
        <main className="flex min-h-screen flex-col bg-background transition-colors duration-300 font-sans">

            {/* Header Section */}
            <div className="w-full bg-card border-b border-border px-8 py-8 md:px-12 md:py-8 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                            <Wallet className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                            Caisse & Flux Espèces
                        </h1>
                        <p className="text-muted-foreground mt-1 font-medium">Suivi des entrées et sorties de monnaie.</p>
                    </div>

                    <div className="flex gap-3">
                        <ImportPopinaButton />
                        <ExportDialog transactions={transactions} accountantEmail={settings?.accountantEmail} />
                        <AddTransactionDialog categories={categories} />
                    </div>
                </div>
            </div>

            <div className="flex-1 px-8 py-8 md:px-12 max-w-7xl mx-auto w-full">

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col gap-2 transition-all hover:shadow-md">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <ArrowUpCircle className="h-4 w-4 text-emerald-500" /> Total Entrées
                        </span>
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+{totalIn.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col gap-2 transition-all hover:shadow-md">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <ArrowDownCircle className="h-4 w-4 text-rose-500" /> Total Sorties
                        </span>
                        {/* totalOut is negative, so it will display as "-95 593 €" automatically */}
                        <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{totalOut.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col gap-2 ring-2 ring-blue-500/20 dark:ring-blue-500/10 transition-all hover:shadow-md">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-blue-500" /> Solde Théorique
                        </span>
                        <span className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                    </div>
                </div>

                <Tabs defaultValue="entrees" className="w-full space-y-8">
                    <div className="flex justify-center md:justify-start">
                        <TabsList className="p-1 bg-muted rounded-2xl w-auto inline-flex shadow-inner border border-border/50">
                            <TabsTrigger value="entrees" className="px-8 py-2.5 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all font-bold">
                                <ArrowUpCircle className="h-4 w-4 text-emerald-500" /> Entrées
                            </TabsTrigger>
                            <TabsTrigger value="sorties" className="px-8 py-2.5 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all font-bold">
                                <ArrowDownCircle className="h-4 w-4 text-rose-500" /> Sorties
                            </TabsTrigger>
                            <TabsTrigger value="stats" className="px-8 py-2.5 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all font-bold">
                                <TrendingUp className="h-4 w-4 text-blue-500" /> Analyses
                            </TabsTrigger>
                            <TabsTrigger value="categories" className="px-8 py-2.5 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all font-bold">
                                <Settings className="h-4 w-4" /> Config
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="entrees" className="mt-0 animate-in fade-in-50 duration-500 outline-none">
                        <MonthlyTransactionList transactions={entrees} categories={categories} />
                    </TabsContent>

                    <TabsContent value="sorties" className="mt-0 animate-in fade-in-50 duration-500 outline-none">
                        <MonthlyTransactionList transactions={sorties} categories={categories} />
                    </TabsContent>

                    <TabsContent value="stats" className="mt-0 outline-none">
                        <CaisseStats transactions={transactions} />
                    </TabsContent>

                    <TabsContent value="categories" className="mt-0 animate-in fade-in-50 duration-500 outline-none">
                        <CaisseConfig settings={settings} initialCategories={categories} />
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    )
}
