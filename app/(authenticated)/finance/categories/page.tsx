import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Tags } from 'lucide-react';
import { CategoryListClient } from './CategoryListClient';
import { FinanceCategoryType } from '@prisma/client';

export const metadata: Metadata = {
    title: 'Gestion des Catégories | Restaurant-OS',
    description: 'Créez et modifiez les catégories financières',
};

export const dynamic = 'force-dynamic';

export default async function FinanceCategoriesPage() {
    const categories = await prisma.financeCategory.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { transactions: true, fixedCosts: true }
            }
        }
    });

    const transformedCategories = categories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        transactionCount: c._count.transactions,
        fixedCostCount: c._count.fixedCosts
    }));

    // Pass the Prisma ENUM locally so TypeScript doesn't complain in the client
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
                        <Tags className="h-8 w-8 text-indigo-500" />
                        Catégories Financières
                    </h1>
                    <p className="text-muted-foreground">
                        Créez et modifiez les catégories pour vos transactions.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href="/finance/transactions">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                    <Button variant="default" asChild className="w-full sm:w-auto gap-2">
                        <Link href="/finance/rules">
                            Règles d'Intelligence
                        </Link>
                    </Button>
                </div>
            </div>

            <CategoryListClient
                initialCategories={transformedCategories}
                categoryTypes={categoryTypes}
            />
        </div>
    );
}
