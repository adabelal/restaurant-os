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
    title: 'Configuration: Catégorisation | Siwa-OS',
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
        <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-950 font-sans pb-12 overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-50 dark:from-indigo-950/20 to-transparent pointer-events-none" />
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-emerald-100/40 dark:bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex flex-col gap-10 max-w-7xl mx-auto p-6 md:p-10 relative z-10 w-full animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 group">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl mb-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest transition-transform group-hover:scale-105">
                            <Settings className="h-4 w-4" />
                            <span>Configuration Système</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                            Centre de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-indigo-600">Catégorisation</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
                            Automatisez l'affectation de vos flux financiers avec l'IA et gérez votre plan comptable en temps réel.
                        </p>
                    </div>
                    <Button variant="outline" asChild className="group rounded-[20px] h-14 px-8 bg-white border-2 border-slate-100 hover:border-indigo-500/20 hover:bg-slate-50 transition-all shadow-sm w-full lg:w-auto font-bold text-slate-600">
                        <Link href="/finance/transactions">
                            <ArrowLeft className="mr-3 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                            Retour aux Transactions
                        </Link>
                    </Button>
                </div>

                <Tabs defaultValue="auto" className="w-full">
                    <div className="flex justify-start mb-12">
                        <TabsList className="h-16 p-2 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-[28px] backdrop-blur-3xl shadow-lg ring-1 ring-white/20">
                            <TabsTrigger value="auto" className="rounded-[22px] px-8 sm:px-12 py-3 text-sm font-black transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-500 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-xl flex items-center gap-3">
                                <Sparkles className="h-5 w-5" />
                                <span>Analyse IA</span>
                            </TabsTrigger>
                            <TabsTrigger value="rules" className="rounded-[22px] px-8 sm:px-12 py-3 text-sm font-black transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-xl flex items-center gap-3">
                                <BookKey className="h-5 w-5" />
                                <span>Auto-Règles</span>
                            </TabsTrigger>
                            <TabsTrigger value="categories" className="rounded-[22px] px-8 sm:px-12 py-3 text-sm font-black transition-all data-[state=active]:bg-white data-[state=active]:text-violet-600 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-violet-400 data-[state=active]:shadow-xl flex items-center gap-3">
                                <Tags className="h-5 w-5" />
                                <span>Plan Comptable</span>
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
