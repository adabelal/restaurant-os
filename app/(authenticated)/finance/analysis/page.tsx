import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PieChart } from 'lucide-react';
import { AnalysisClient, CategoryDataItem } from './AnalysisClient';

export const metadata: Metadata = {
    title: 'Analyse par Catégorie | Restaurant-OS',
    description: 'Analyse dynamique de vos finances',
};

export const dynamic = 'force-dynamic';

export default async function FinanceAnalysisPage() {
    // We fetch categories to use as a legend or map
    const categories = await prisma.financeCategory.findMany({
        orderBy: { name: 'asc' }
    });

    // We fetch all bank transactions that are categorized to build the dataset
    const transactions = await prisma.bankTransaction.findMany({
        where: { categoryId: { not: null } },
        include: { category: true }
    });

    const cashTransactions = await prisma.cashTransaction.findMany({
        where: { categoryId: { not: null } },
        include: { category: true }
    });

    const allTx = [
        ...transactions.map(t => ({
            categoryId: t.categoryId,
            category: t.category,
            amount: Number(t.amount),
            date: t.date
        })),
        ...cashTransactions.map(t => ({
            categoryId: t.categoryId,
            category: t.category as any, // Typecast since it might technically conflict strictly, but content is same
            amount: t.type === 'OUT' ? -Number(t.amount) : Number(t.amount),
            date: t.date
        }))
    ]

    const categoriesMap = new Map(categories.map(c => [c.id, c]))

    // Grouping by type (Revenue vs Expenses) and by Category
    const categoryData: Record<string, CategoryDataItem> = {};

    // Default structure for the timeline (e.g. last 6 months)
    const today = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        return { label: d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }), raw: d };
    }).reverse();

    allTx.forEach(t => {
        if (!t.categoryId || !t.category) return;

        const catId = t.categoryId;
        if (!categoryData[catId]) {
            categoryData[catId] = {
                id: catId,
                name: t.category.name,
                type: t.category.type,
                totalAmount: 0,
                monthlyData: {}
            };
        }

        const amount = Number(t.amount);
        // We track absolutely everything as expenses/revenues positive for charts
        categoryData[catId].totalAmount += Math.abs(amount);

        const txMonth = t.date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
        if (!categoryData[catId].monthlyData[txMonth]) {
            categoryData[catId].monthlyData[txMonth] = 0;
        }
        categoryData[catId].monthlyData[txMonth] += Math.abs(amount);
    });

    const transformedData = Object.values(categoryData).sort((a, b) => b.totalAmount - a.totalAmount);

    return (
        <div className="flex flex-col gap-6 md:gap-8 max-w-7xl mx-auto p-4 md:p-8 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
                        <PieChart className="h-8 w-8 text-indigo-500" />
                        Analyse Dynamique
                    </h1>
                    <p className="text-muted-foreground">
                        Visualisez la répartition de vos charges et recettes par catégorie.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href="/finance">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                </div>
            </div>

            <AnalysisClient
                data={transformedData}
                months={months.map(m => m.label)}
            />
        </div>
    );
}
