import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookKey } from 'lucide-react';
import { RuleListClient } from './RuleListClient';

export const metadata: Metadata = {
    title: 'Mes Règles de Catégorisation | Restaurant-OS',
    description: 'Créez des règles de mots-clés pour catégoriser automatiquement vos relevés.',
};

export const dynamic = 'force-dynamic';

export default async function FinanceRulesPage() {
    const rules = await prisma.categorizationRule.findMany({
        orderBy: { keyword: 'asc' },
        include: {
            category: true
        }
    });

    const categories = await prisma.financeCategory.findMany({
        orderBy: { name: 'asc' }
    });

    const transformedRules = rules.map(r => ({
        id: r.id,
        keyword: r.keyword,
        matchType: r.matchType,
        categoryId: r.categoryId,
        categoryName: r.category.name,
        categoryType: r.category.type
    }));

    const transformedCategories = categories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type
    }));

    return (
        <div className="flex flex-col gap-6 md:gap-8 max-w-7xl mx-auto p-4 md:p-8 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
                        <BookKey className="h-8 w-8 text-indigo-500" />
                        Règles d'Auto-Catégorisation
                    </h1>
                    <p className="text-muted-foreground">
                        Définissez vos propres mots-clés pour classer automatiquement vos transactions.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href="/finance/categories">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                </div>
            </div>

            <RuleListClient
                initialRules={transformedRules}
                categories={transformedCategories}
            />
        </div>
    );
}
