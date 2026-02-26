import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, FileText, Search, CreditCard, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

export const metadata: Metadata = {
    title: 'Toutes les transactions | Restaurant-OS',
    description: 'Historique complet des transactions bancaires et imports',
};

export const dynamic = 'force-dynamic';

export default async function AllTransactionsPage({
    searchParams
}: {
    searchParams: { q?: string }
}) {
    const query = searchParams.q || '';

    // Fetch transactions with related category information
    // We intentionally grab a lot of them (e.g. up to 1000) so they can see all their history.
    // We keep them permanently in the database so it goes beyond the bank's 90-day typical limit.
    const transactions = await prisma.bankTransaction.findMany({
        where: query ? {
            description: {
                contains: query,
                mode: 'insensitive'
            }
        } : undefined,
        orderBy: { date: 'desc' },
        take: 1000,
        include: {
            category: true,
            purchaseOrder: true
        }
    });

    const totalIncome = transactions.filter(t => Number(t.amount) > 0).reduce((acc, t) => acc + Number(t.amount), 0);
    const totalExpense = transactions.filter(t => Number(t.amount) < 0).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto p-8 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
                        <FileText className="h-8 w-8 text-indigo-500" />
                        Toutes les transactions
                    </h1>
                    <p className="text-muted-foreground">
                        Historique complet sans la limite de 90 jours imposée par les banques.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/finance">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Tableau de Bord
                        </Link>
                    </Button>
                    <Button variant="default" asChild>
                        <Link href="/finance/bank">
                            <Landmark className="mr-2 h-4 w-4" />
                            Gérer ma banque
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-sm border-border bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Transactions trouvées</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{transactions.length}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-emerald-100 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-900/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total des entrées affichées</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {totalIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-rose-100 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-900/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Total des sorties affichées</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                            {totalExpense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border-border bg-card overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between items-center w-full">
                    <form className="w-full sm:max-w-md relative flex items-center" method="GET" action="/finance/transactions">
                        <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
                        <Input
                            name="q"
                            type="search"
                            defaultValue={query}
                            placeholder="Rechercher une transaction..."
                            className="pl-9 bg-background w-full"
                        />
                        <Button type="submit" variant="secondary" className="hidden">Rechercher</Button>
                    </form>
                </div>

                <div className="divide-y divide-border">
                    {transactions.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            Aucune transaction trouvée. {query && "Essayez de changer votre recherche."}
                        </div>
                    ) : (
                        transactions.map((t) => (
                            <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-4">
                                <div className="flex items-start sm:items-center gap-4">
                                    <div className={`mt-1 sm:mt-0 p-3 rounded-xl shadow-sm ${Number(t.amount) >= 0
                                        ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 dark:from-emerald-900/40 dark:to-emerald-900/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                        : 'bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                                        }`}>
                                        {Number(t.amount) >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-foreground text-sm leading-tight max-w-xl line-clamp-2">
                                            {t.description}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                                                <CreditCard className="w-3.5 h-3.5 opacity-70" />
                                                {format(new Date(t.date), 'dd MMMM yyyy', { locale: fr })}
                                            </span>

                                            {t.category && (
                                                <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-900/50 font-medium">
                                                    {t.category.name}
                                                </Badge>
                                            )}

                                            {t.reference && t.reference.includes('ENABLE_BANKING') && (
                                                <Badge variant="outline" className="text-[10px] h-5 px-2 font-medium opacity-60">
                                                    Auto
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={`text-right w-full sm:w-auto flex justify-end`}>
                                    <div className={`text-base font-bold px-3 py-1 rounded-md ${Number(t.amount) >= 0
                                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                                        : 'text-foreground'
                                        }`}>
                                        {Number(t.amount) > 0 ? '+' : ''}{Number(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
