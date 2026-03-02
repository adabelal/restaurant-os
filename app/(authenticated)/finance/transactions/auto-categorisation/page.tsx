import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { AutoCatClient } from './AutoCatClient';

export const metadata: Metadata = {
    title: 'Catégorisation Intelligente | Restaurant-OS',
    description: 'Catégorisation automatique et manuelle des transactions',
};

export const dynamic = 'force-dynamic';

export default async function AutoCategorisationPage() {
    // 1. Fetch ALL finance categories to let the user pick
    const categories = await prisma.financeCategory.findMany({
        orderBy: { name: 'asc' }
    });

    // 2. Fetch uncategorized transactions
    const uncategorized = await prisma.bankTransaction.findMany({
        where: { categoryId: null },
        orderBy: { date: 'desc' },
        take: 300 // reasonable limit for manual
    });

    const transformedCategories = categories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type
    }));

    const transformedTransactions = uncategorized.map(t => ({
        id: t.id,
        date: t.date,
        amount: Number(t.amount),
        description: t.description,
        transactionType: (t as any).transactionType || null,
        paymentMethod: (t as any).paymentMethod || null,
        thirdPartyName: (t as any).thirdPartyName || null,
    }));

    return (
        <div className="flex flex-col gap-6 md:gap-8 max-w-7xl mx-auto p-4 md:p-8 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
                        <Sparkles className="h-8 w-8 text-indigo-500" />
                        Catégorisation Intelligente
                    </h1>
                    <p className="text-muted-foreground">
                        Utilisez nos règles intelligentes ou assignez manuellement des catégories à vos transactions non classées.
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

            <AutoCatClient
                initialTransactions={transformedTransactions}
                categories={transformedCategories}
            />
        </div>
    );
}
