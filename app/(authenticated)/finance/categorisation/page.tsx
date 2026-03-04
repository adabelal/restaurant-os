import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, BookKey, Tags, Settings } from 'lucide-react';
import { AutoCatClient } from './AutoCatClient';
import { CategoryListClient } from './CategoryListClient';
import { RuleListClient } from './RuleListClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
    title: 'Configuration: Catégorisation | Restaurant-OS',
    description: 'Catégorisation automatique et manuelle des transactions',
};

export const dynamic = 'force-dynamic';

export default async function FinanceCategorisationHubPage() {
    // 1. Fetch categories
    const categories = await prisma.financeCategory.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { transactions: true, fixedCosts: true, cashTransactions: true }
            }
        }
    });

    const transformedCategories = categories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        transactionCount: c._count.transactions + c._count.cashTransactions, // include both!
        fixedCostCount: c._count.fixedCosts
    }));

    // 2. Fetch Rules
    const rules = await prisma.categorizationRule.findMany({
        orderBy: { keyword: 'asc' },
        include: { category: true }
    });

    const transformedRules = rules.map(r => ({
        id: r.id,
        keyword: r.keyword,
        matchType: r.matchType,
        categoryId: r.categoryId,
        categoryName: r.category.name,
        categoryType: r.category.type
    }));

    // 3. Fetch Uncategorized
    const uncategorizedBank = await prisma.bankTransaction.findMany({
        where: { categoryId: null },
        orderBy: { date: 'desc' },
        take: 300 // limit to avoid heavy DOM
    });

    // Merge in uncategorized cash? The user might have uncategorized cash too.
    const uncategorizedCash = await prisma.cashTransaction.findMany({
        where: { categoryId: null },
        orderBy: { date: 'desc' },
        take: 100
    });

    const transformedTransactions = [
        ...uncategorizedBank.map(t => ({
            id: t.id,
            date: t.date,
            amount: Number(t.amount),
            description: t.description,
            transactionType: (t as any).transactionType || null,
            paymentMethod: (t as any).paymentMethod || null,
            thirdPartyName: (t as any).thirdPartyName || null,
        })),
        ...uncategorizedCash.map(c => ({
            id: c.id,
            date: c.date,
            amount: Number(c.amount),
            description: c.description,
            transactionType: 'CAISSE',
            paymentMethod: 'CASH',
            thirdPartyName: null
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    const categoryTypes = [
        "FIXED_COST",
        "VARIABLE_COST",
        "REVENUE",
        "TAX",
        "FINANCIAL",
        "INVESTMENT",
        "SALARY",
        "INTERNAL_TRANSFER",
        "TRANSIT"
    ]

    return (
        <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-950/50 font-sans pb-12">
            {/* Background elements */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-indigo-100/60 via-purple-50/30 to-transparent dark:from-indigo-950/40 dark:via-purple-900/10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-300/20 dark:bg-indigo-800/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="flex flex-col gap-8 max-w-7xl mx-auto p-4 md:p-8 relative z-10 w-full">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-indigo-900/50 shadow-sm ring-1 ring-slate-200 dark:ring-indigo-900/20 rounded-2xl mb-2 text-indigo-600 dark:text-indigo-400">
                            <Settings className="h-6 w-6" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                            Centre de Catégorisation
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
                            Gérez finement vos catégories récurrentes, affinez vos règles d'affection et lancez l'auto-catégorisation intelligente de vos flux.
                        </p>
                    </div>
                    <Button variant="outline" asChild className="group rounded-xl h-11 px-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 hover:border-indigo-200 hover:bg-white dark:border-slate-800 dark:hover:border-indigo-900 dark:hover:bg-slate-950 transition-all shadow-sm w-full lg:w-auto">
                        <Link href="/finance/transactions">
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Retour aux finances
                        </Link>
                    </Button>
                </div>

                <Tabs defaultValue="auto" className="w-full mt-4">
                    <div className="flex justify-start mb-8 overflow-x-auto pb-2 scrollbar-hide">
                        <TabsList className="inline-flex h-auto p-1.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl backdrop-blur-xl shadow-sm">
                            <TabsTrigger value="auto" className="rounded-xl px-5 sm:px-8 py-3 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-md flex items-center gap-2.5">
                                <Sparkles className="h-4 w-4" />
                                <span className="hidden sm:inline">Analyse de l'IA</span>
                                <span className="sm:hidden">IA</span>
                            </TabsTrigger>
                            <TabsTrigger value="rules" className="rounded-xl px-5 sm:px-8 py-3 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-md flex items-center gap-2.5">
                                <BookKey className="h-4 w-4" />
                                <span className="hidden sm:inline">Mots-clés & Règles</span>
                                <span className="sm:hidden">Règles</span>
                            </TabsTrigger>
                            <TabsTrigger value="categories" className="rounded-xl px-5 sm:px-8 py-3 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-violet-600 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-violet-400 data-[state=active]:shadow-md flex items-center gap-2.5">
                                <Tags className="h-4 w-4" />
                                <span className="hidden sm:inline">Plan Comptable</span>
                                <span className="sm:hidden">Catégories</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="auto" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <AutoCatClient
                            initialTransactions={transformedTransactions}
                            categories={transformedCategories}
                        />
                    </TabsContent>

                    <TabsContent value="rules" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <RuleListClient
                            initialRules={transformedRules}
                            categories={transformedCategories}
                        />
                    </TabsContent>

                    <TabsContent value="categories" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CategoryListClient
                            initialCategories={transformedCategories}
                            categoryTypes={categoryTypes}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
