import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Landmark } from 'lucide-react';
import { TransactionListClient, TransformedTx } from './TransactionListClient';

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
    const categories = await prisma.financeCategory.findMany({
        orderBy: { name: 'asc' }
    });

    // Fetch transactions with related category information
    const transactions = await prisma.bankTransaction.findMany({
        orderBy: { date: 'desc' },
        take: 1000,
        include: {
            category: true,
            purchaseOrder: true
        }
    });

    // Map the Decimal to number and extract new fields so that the Client Component can use them
    const transformed: TransformedTx[] = transactions.map(t => ({
        id: t.id,
        date: t.date,
        amount: Number(t.amount),
        description: t.description,
        reference: t.reference,
        transactionType: (t as any).transactionType || null,
        paymentMethod: (t as any).paymentMethod || null,
        thirdPartyName: (t as any).thirdPartyName || null,
        categoryName: t.category?.name || null,
        categoryId: t.categoryId || null
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
                        <Landmark className="h-8 w-8 text-indigo-500" />
                        Banque
                    </h1>
                    <p className="text-muted-foreground">
                        Historique complet, recherches, filtres croisés et totaux calculés dynamiquement.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href="/finance/categorisation">
                            Catégorisation
                        </Link>
                    </Button>
                    <Button variant="secondary" asChild className="w-full sm:w-auto bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/50">
                        <Link href="/finance/analysis">
                            Analyse
                        </Link>
                    </Button>
                    <Button variant="default" asChild className="w-full sm:w-auto">
                        <Link href="/finance">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Tableau de Bord
                        </Link>
                    </Button>
                </div>
            </div>

            <TransactionListClient
                initialTransactions={transformed}
                categories={transformedCategories}
            />
        </div>
    );
}
