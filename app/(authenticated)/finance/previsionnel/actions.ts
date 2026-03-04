'use server'

import { prisma } from "@/lib/prisma"
import { startOfMonth, subMonths, endOfMonth, format } from "date-fns"
import { fr } from "date-fns/locale"
import { FinanceCategoryType } from "@prisma/client"

export type ForecastCategoryInfo = {
    categoryId: string
    name: string
    type: FinanceCategoryType
    avgMonthly: number
    currentMonth: number
    remainingPlanned: number
    isOverBudget: boolean
}

export type ForecastData = {
    monthlyAverageRevenue: number
    monthlyAverageExpenses: number
    expectedNetResult: number
    currentBalance: number
    projectedEndOfMonthBalance: number
    categories: ForecastCategoryInfo[]
    historicalMonths: string[]
}

export async function getForecastData(monthsToAverage: number = 3) {
    try {
        const now = new Date()
        const currentMonthStart = startOfMonth(now)

        // 1. Define reference period (last N full months)
        const referenceStart = startOfMonth(subMonths(now, monthsToAverage))
        const referenceEnd = endOfMonth(subMonths(now, 1))

        // 2. Fetch all categorized transactions in reference period
        const historicalBankTxs = await prisma.bankTransaction.findMany({
            where: {
                date: { gte: referenceStart, lte: referenceEnd },
                categoryId: { not: null }
            },
            include: { category: true }
        })

        const historicalCashTxs = await prisma.cashTransaction.findMany({
            where: {
                date: { gte: referenceStart, lte: referenceEnd },
                categoryId: { not: null }
            },
            include: { category: true }
        })

        // 3. Fetch current month transactions
        const currentBankTxs = await prisma.bankTransaction.findMany({
            where: {
                date: { gte: currentMonthStart },
                categoryId: { not: null }
            },
            include: { category: true }
        })

        const currentCashTxs = await prisma.cashTransaction.findMany({
            where: {
                date: { gte: currentMonthStart },
                categoryId: { not: null }
            },
            include: { category: true }
        })

        // 4. Fetch Fixed Costs (The "planned" truth)
        const fixedCosts = await prisma.fixedCost.findMany({
            where: { isActive: true },
            include: { category: true }
        })

        // 5. Aggregate logic
        const catStats: Record<string, {
            name: string,
            type: FinanceCategoryType,
            totalHistorical: number,
            current: number,
            fixedPlanned: number
        }> = {}

        // Helper to collect data
        const addTx = (tx: any, isHistory: boolean) => {
            const cat = tx.category
            if (!cat) return

            if (!catStats[cat.id]) {
                catStats[cat.id] = {
                    name: cat.name,
                    type: cat.type as FinanceCategoryType,
                    totalHistorical: 0,
                    current: 0,
                    fixedPlanned: 0
                }
            }

            // Handle negative/positive amounts correctly based on transaction type if needed
            // For bank transactions, amount is already signed (income > 0, expense < 0)
            // For cash transactions, we should check type or sign
            let amount = Number(tx.amount)
            if ('type' in tx && tx.type === 'OUT') amount = -Math.abs(amount) // Ensure OUT is negative

            if (isHistory) {
                catStats[cat.id].totalHistorical += amount
            } else {
                catStats[cat.id].current += amount
            }
        }

        historicalBankTxs.forEach((tx) => addTx(tx, true))
        historicalCashTxs.forEach((tx) => addTx(tx, true))
        currentBankTxs.forEach((tx) => addTx(tx, false))
        currentCashTxs.forEach((tx) => addTx(tx, false))

        // Add fixed planned info
        fixedCosts.forEach((fc) => {
            if (!catStats[fc.categoryId]) {
                catStats[fc.categoryId] = {
                    name: fc.category.name,
                    type: fc.category.type as FinanceCategoryType,
                    totalHistorical: 0,
                    current: 0,
                    fixedPlanned: 0
                }
            }
            catStats[fc.categoryId].fixedPlanned += Number(fc.amount)
        })

        // 6. Calculate Balance
        const balanceResult = await prisma.bankTransaction.aggregate({
            _sum: { amount: true }
        })
        const currentBalance = Number(balanceResult._sum.amount || 0)

        // 7. Process to final format
        const categories: ForecastCategoryInfo[] = Object.entries(catStats).map(([id, stats]) => {
            const avgMonthly = stats.totalHistorical / monthsToAverage

            // For expenses (negative), avgMonthly will be negative. 
            // We compare absolute values for "over budget" logic if needed, 
            // but here we use the signed values.

            let remainingPlanned = 0
            if (stats.type === 'REVENUE') {
                remainingPlanned = Math.max(0, avgMonthly - stats.current)
            } else {
                // For expenses, we expect to spend avgMonthly (which is negative)
                // stats.current is what we spent already (negative)
                // remaining is the difference
                remainingPlanned = Math.min(0, avgMonthly - stats.current)
            }

            return {
                categoryId: id,
                name: stats.name,
                type: stats.type,
                avgMonthly: Math.round(avgMonthly * 100) / 100,
                currentMonth: Math.round(stats.current * 100) / 100,
                remainingPlanned: Math.round(remainingPlanned * 100) / 100,
                isOverBudget: stats.type !== 'REVENUE' && stats.current < avgMonthly // More negative = more spent
            }
        })

        const monthlyAverageRevenue = categories
            .filter(c => c.type === 'REVENUE')
            .reduce((sum, c) => sum + c.avgMonthly, 0)

        const monthlyAverageExpenses = categories
            .filter(c => c.type !== 'REVENUE')
            .reduce((sum, c) => sum + Math.abs(c.avgMonthly), 0)

        const totalRemainingToSpend = categories
            .filter(c => c.type !== 'REVENUE')
            .reduce((sum, c) => sum + c.remainingPlanned, 0)

        const totalRemainingRevenue = categories
            .filter(c => c.type === 'REVENUE')
            .reduce((sum, c) => sum + c.remainingPlanned, 0)

        const projectedEndOfMonthBalance = currentBalance + totalRemainingToSpend + totalRemainingRevenue

        // Generate month labels for the UI
        const historicalMonths = Array.from({ length: monthsToAverage }, (_, i) => {
            const d = subMonths(now, i + 1)
            return format(d, 'MMMM yyyy', { locale: fr })
        }).reverse()

        return {
            monthlyAverageRevenue,
            monthlyAverageExpenses,
            expectedNetResult: monthlyAverageRevenue - monthlyAverageExpenses,
            currentBalance,
            projectedEndOfMonthBalance,
            categories,
            historicalMonths
        }

    } catch (error) {
        console.error("Error in getForecastData:", error)
        throw error
    }
}
