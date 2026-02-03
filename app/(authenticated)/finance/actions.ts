'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// FINANCE CATEGORIES
export async function getFinanceCategories() {
    try {
        const categories = await prisma.financeCategory.findMany({
            orderBy: { name: 'asc' }
        })
        return categories
    } catch (error) {
        console.error("Error fetching finance categories:", error)
        return []
    }
}

export async function createFinanceCategory(name: string, type: 'FIXED_COST' | 'VARIABLE_COST' | 'REVENUE' | 'TAX' | 'FINANCIAL' | 'INVESTMENT' | 'SALARY') {
    try {
        const category = await prisma.financeCategory.create({
            data: {
                name,
                type
            }
        })
        revalidatePath('/finance')
        return { success: true, data: category }
    } catch (error) {
        console.error("Error creating finance category:", error)
        return { success: false, error }
    }
}

// FIXED COSTS
export async function getFixedCosts() {
    try {
        const costs = await prisma.fixedCost.findMany({
            include: {
                category: true
            },
            orderBy: { dayOfMonth: 'asc' }
        })
        return costs
    } catch (error) {
        console.error("Error fetching fixed costs:", error)
        return []
    }
}

export async function addFixedCost(data: {
    name: string
    amount: number
    dayOfMonth: number
    frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
    categoryId: string
}) {
    try {
        const cost = await prisma.fixedCost.create({
            data: {
                name: data.name,
                amount: data.amount,
                dayOfMonth: data.dayOfMonth,
                frequency: data.frequency,
                category: {
                    connect: { id: data.categoryId }
                }
            }
        })
        revalidatePath('/finance/charges')
        return { success: true, data: cost }
    } catch (error) {
        console.error("Error adding fixed cost:", error)
        return { success: false, error }
    }
}

export async function deleteFixedCost(id: string) {
    try {
        await prisma.fixedCost.delete({
            where: { id }
        })
        revalidatePath('/finance/charges')
        return { success: true }
    } catch (error) {
        console.error("Error deleting fixed cost:", error)
        return { success: false, error }
    }
}

// BANK TRANSACTIONS & CHART DATA
export async function getBankTransactions(params?: {
    page?: number,
    limit?: number,
    search?: string
}) {
    const page = params?.page || 1
    const limit = params?.limit || 20
    const search = params?.search || ""
    const skip = (page - 1) * limit

    try {
        const [transactions, total] = await Promise.all([
            prisma.bankTransaction.findMany({
                where: {
                    OR: [
                        { description: { contains: search, mode: 'insensitive' } }
                    ]
                },
                orderBy: { date: 'desc' },
                skip,
                take: limit,
                include: { category: true }
            }),
            prisma.bankTransaction.count({
                where: {
                    OR: [
                        { description: { contains: search, mode: 'insensitive' } }
                    ]
                }
            })
        ])

        return {
            transactions,
            totalPages: Math.ceil(total / limit),
            totalCount: total
        }
    } catch (error) {
        console.error("Error fetching transactions:", error)
        return { transactions: [], totalPages: 0, totalCount: 0 }
    }
}

export async function getBalanceChartData() {
    try {
        const transactions = await prisma.bankTransaction.findMany({
            orderBy: { date: 'asc' },
            select: { date: true, amount: true }
        })

        if (transactions.length === 0) return []

        const monthlyData: { [key: string]: number } = {}
        let runningBalance = 0

        transactions.forEach(tx => {
            const date = new Date(tx.date)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            runningBalance += Number(tx.amount)
            monthlyData[monthKey] = runningBalance
        })

        const chartData = Object.entries(monthlyData)
            .map(([month, balance]) => ({
                month,
                balance: Math.round(balance * 100) / 100
            }))
            .slice(-12)

        return chartData
    } catch (error) {
        console.error("Error generating chart data:", error)
        return []
    }
}

export async function syncFinanceIntelligence() {
    try {
        // 1. Categories
        const categories = [
            { name: 'Loyer & Charges', type: 'FIXED_COST' },
            { name: 'Assurances', type: 'FIXED_COST' },
            { name: 'Télécom & Tech', type: 'FIXED_COST' },
            { name: 'Achats Matières', type: 'VARIABLE_COST' },
            { name: 'Social & URSSAF', type: 'VARIABLE_COST' },
            { name: 'Énergie', type: 'FIXED_COST' },
            { name: 'Ventes CB', type: 'REVENUE' }
        ]

        const catMap: Record<string, string> = {}
        for (const c of categories) {
            let cat = await prisma.financeCategory.findFirst({ where: { name: c.name } })
            if (!cat) {
                cat = await prisma.financeCategory.create({
                    data: { name: c.name, type: c.type as any }
                })
            }
            catMap[c.name] = cat.id
        }

        // 2. Initial Balance Adjustment
        const adjustment = 26695.75
        const existingAdj = await prisma.bankTransaction.findFirst({
            where: { description: "RAPPORT DE SOLDE INITIAL" }
        })

        if (!existingAdj) {
            await prisma.bankTransaction.create({
                data: {
                    date: new Date('2023-11-01'),
                    amount: adjustment,
                    description: "RAPPORT DE SOLDE INITIAL",
                    status: 'RECONCILED'
                }
            })
        }

        // 3. Fixed Costs
        const fixedCosts = [
            { name: 'Loyer Local', amount: 3600, dayOfMonth: 5, category: 'Loyer & Charges' },
            { name: 'Abonnement Orange', amount: 63.60, dayOfMonth: 10, category: 'Télécom & Tech' },
            { name: 'Loyer TPE', amount: 37.69, dayOfMonth: 1, category: 'Loyer & Charges' },
            { name: 'Assurance Groupama', amount: 30.15, dayOfMonth: 1, category: 'Assurances' }
        ]

        for (const fc of fixedCosts) {
            const existingCost = await prisma.fixedCost.findFirst({ where: { name: fc.name } })
            if (!existingCost) {
                await prisma.fixedCost.create({
                    data: {
                        name: fc.name,
                        amount: fc.amount,
                        dayOfMonth: fc.dayOfMonth,
                        frequency: 'MONTHLY',
                        isActive: true,
                        categoryId: catMap[fc.category]
                    }
                })
            }
        }

        // 4. Auto-Categorize existing
        const rules = [
            { pattern: 'METRO', category: 'Achats Matières' },
            { pattern: 'URSSAF', category: 'Social & URSSAF' },
            { pattern: 'GROUPAMA', category: 'Assurances' },
            { pattern: 'ORANGE', category: 'Télécom & Tech' },
            { pattern: 'LOYER', category: 'Loyer & Charges' },
            { pattern: 'EDF', category: 'Énergie' },
            { pattern: 'ENGIE', category: 'Énergie' },
            { pattern: 'REMISE CB', category: 'Ventes CB' }
        ]

        for (const rule of rules) {
            const targetCatId = catMap[rule.category]
            if (!targetCatId) continue

            await prisma.bankTransaction.updateMany({
                where: {
                    description: { contains: rule.pattern, mode: 'insensitive' },
                    categoryId: null
                },
                data: { categoryId: targetCatId }
            })
        }

        revalidatePath('/finance')
        return { success: true }
    } catch (error) {
        console.error("Sync error:", error)
        return { success: false, error: String(error) }
    }
}
