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

        // Group by month and calculate running balance
        const monthlyData: { [key: string]: number } = {}
        let runningBalance = 0

        transactions.forEach(tx => {
            const date = new Date(tx.date)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            runningBalance += Number(tx.amount)
            monthlyData[monthKey] = runningBalance
        })

        // Format for Recharts
        const chartData = Object.entries(monthlyData)
            .map(([month, balance]) => ({
                month,
                balance: Math.round(balance * 100) / 100
            }))
            .slice(-12) // Last 12 months

        return chartData
    } catch (error) {
        console.error("Error generating chart data:", error)
        return []
    }
}
