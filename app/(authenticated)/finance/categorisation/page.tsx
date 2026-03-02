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
            amount: c.type === 'OUT' ? -Number(c.amount) : Number(c.amount),
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
        "SALARY"
    ]

    return (
        <div className="flex flex-col gap-6 md:gap-8 max-w-7xl mx-auto p-4 md:p-8 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
                        <Settings className="h-8 w-8 text-indigo-500" />
                        Centre de Catégorisation
                    </h1>
                    <p className="text-muted-foreground">
                        Gérez vos catégories, règles d'affection et auto-catégorisez vos mouvements.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href="/finance/transactions">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="auto" className="w-full">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto mb-6">
                    <TabsTrigger value="auto" className="py-3 text-sm flex gap-2">
                        <Sparkles className="h-4 w-4" /> Analyse de l'IA
                    </TabsTrigger>
                    <TabsTrigger value="rules" className="py-3 text-sm flex gap-2">
                        <BookKey className="h-4 w-4" /> Mots-clés & Règles
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="py-3 text-sm flex gap-2">
                        <Tags className="h-4 w-4" /> Gestion des Catégories
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="auto" className="mt-0 outline-none">
                    <AutoCatClient
                        initialTransactions={transformedTransactions}
                        categories={transformedCategories}
                    />
                </TabsContent>

                <TabsContent value="rules" className="mt-0 outline-none">
                    <RuleListClient
                        initialRules={transformedRules}
                        categories={transformedCategories}
                    />
                </TabsContent>

                <TabsContent value="categories" className="mt-0 outline-none">
                    <CategoryListClient
                        initialCategories={transformedCategories}
                        categoryTypes={categoryTypes}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
