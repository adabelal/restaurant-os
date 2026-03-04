'use server'

import { prisma } from "@/lib/prisma"
import { startOfMonth, subMonths, endOfMonth, format, getDaysInMonth, getDate } from "date-fns"
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

export type OfficialBaselines = {
    year: string
    months: number
    ca: number
    ebe: number
    netResult: number
    cashflow: number
    payroll: number
    costOfSales: number
}

export type MonthlyBreakdown = {
    month: string       // "Jan 2025"
    revenue: number
    expenses: number
    net: number
}

export type ForecastData = {
    // Core metrics
    monthlyAverageRevenue: number
    monthlyAverageExpenses: number
    avgFixedCosts: number
    avgVariableCosts: number
    breakEvenPoint: number
    grossMarginPercentage: number
    expectedNetResult: number
    currentBalance: number
    projectedEndOfMonthBalance: number

    // Day-of-month progress
    currentDayOfMonth: number
    totalDaysInMonth: number
    monthProgressPct: number         // 0-100 (how far through the month we are)

    // Treasury alert
    dailyBurnRate: number            // avg daily net cash flow (negative = burning cash)
    daysUntilZero: number | null     // null if not burning

    // Health Score (0-100)
    healthScore: number
    healthLabel: string              // "En Danger" | "Fragile" | "Équilibré" | "Sain" | "Excellent"

    // Waterfall data
    waterfallData: { name: string; value: number; type: 'revenue' | 'expense' | 'result' }[]

    // Historical monthly breakdown (for time-series chart)
    monthlyBreakdown: MonthlyBreakdown[]

    categories: ForecastCategoryInfo[]
    historicalMonths: string[]
    officialBaselines: OfficialBaselines[]
}

export async function getForecastData(monthsToAverage: number = 3): Promise<ForecastData> {
    try {
        const now = new Date()
        const currentMonthStart = startOfMonth(now)

        // 1. Reference period
        const referenceStart = startOfMonth(subMonths(now, monthsToAverage))
        const referenceEnd = endOfMonth(subMonths(now, 1))

        // 2. Historical transactions
        const historicalBankTxs = await prisma.bankTransaction.findMany({
            where: { date: { gte: referenceStart, lte: referenceEnd }, categoryId: { not: null } },
            include: { category: true }
        })
        const historicalCashTxs = await prisma.cashTransaction.findMany({
            where: { date: { gte: referenceStart, lte: referenceEnd }, categoryId: { not: null } },
            include: { category: true }
        })

        // 3. Current month
        const currentBankTxs = await prisma.bankTransaction.findMany({
            where: { date: { gte: currentMonthStart }, categoryId: { not: null } },
            include: { category: true }
        })
        const currentCashTxs = await prisma.cashTransaction.findMany({
            where: { date: { gte: currentMonthStart }, categoryId: { not: null } },
            include: { category: true }
        })

        // 4. Fixed costs
        const fixedCosts = await prisma.fixedCost.findMany({
            where: { isActive: true },
            include: { category: true }
        })

        // 5. Monthly breakdown — fetch 6 months for timeseries chart
        const sixMonthsAgo = startOfMonth(subMonths(now, 6))
        const allBankTxs6M = await prisma.bankTransaction.findMany({
            where: { date: { gte: sixMonthsAgo }, categoryId: { not: null } },
            include: { category: true }
        })
        const allCashTxs6M = await prisma.cashTransaction.findMany({
            where: { date: { gte: sixMonthsAgo }, categoryId: { not: null } },
            include: { category: true }
        })

        // Build monthly breakdown map
        const breakdownMap: Record<string, { revenue: number; expenses: number }> = {}
        const processForBreakdown = (tx: any) => {
            const monthKey = format(new Date(tx.date), 'MMM yy', { locale: fr })
            if (!breakdownMap[monthKey]) breakdownMap[monthKey] = { revenue: 0, expenses: 0 }
            let amount = Number(tx.amount)
            if ('type' in tx && tx.type === 'OUT') amount = -Math.abs(amount)
            if (tx.category?.type === 'REVENUE') {
                breakdownMap[monthKey].revenue += amount
            } else {
                breakdownMap[monthKey].expenses += Math.abs(amount)
            }
        }
        allBankTxs6M.forEach(processForBreakdown)
        allCashTxs6M.forEach(processForBreakdown)

        const monthlyBreakdown: MonthlyBreakdown[] = Object.entries(breakdownMap)
            .map(([month, d]) => ({ month, revenue: Math.round(d.revenue), expenses: Math.round(d.expenses), net: Math.round(d.revenue - d.expenses) }))
            .slice(-6) // Last 6 months

        // 6. Category aggregation
        const catStats: Record<string, {
            name: string; type: FinanceCategoryType; totalHistorical: number; current: number; fixedPlanned: number
        }> = {}

        const addTx = (tx: any, isHistory: boolean) => {
            const cat = tx.category
            if (!cat) return
            if (!catStats[cat.id]) catStats[cat.id] = { name: cat.name, type: cat.type as FinanceCategoryType, totalHistorical: 0, current: 0, fixedPlanned: 0 }
            let amount = Number(tx.amount)
            if ('type' in tx && tx.type === 'OUT') amount = -Math.abs(amount)
            if (isHistory) catStats[cat.id].totalHistorical += amount
            else catStats[cat.id].current += amount
        }

        historicalBankTxs.forEach(tx => addTx(tx, true))
        historicalCashTxs.forEach(tx => addTx(tx, true))
        currentBankTxs.forEach(tx => addTx(tx, false))
        currentCashTxs.forEach(tx => addTx(tx, false))
        fixedCosts.forEach(fc => {
            if (!catStats[fc.categoryId]) catStats[fc.categoryId] = { name: fc.category.name, type: fc.category.type as FinanceCategoryType, totalHistorical: 0, current: 0, fixedPlanned: 0 }
            catStats[fc.categoryId].fixedPlanned += Number(fc.amount)
        })

        // 7. Balance
        const balanceResult = await prisma.bankTransaction.aggregate({ _sum: { amount: true } })
        const currentBalance = Number(balanceResult._sum.amount || 0)

        // 8. Process categories
        const categories: ForecastCategoryInfo[] = Object.entries(catStats).map(([id, stats]) => {
            const avgMonthly = stats.totalHistorical / monthsToAverage
            let remainingPlanned = 0
            if (stats.type === 'REVENUE') remainingPlanned = Math.max(0, avgMonthly - stats.current)
            else remainingPlanned = Math.min(0, avgMonthly - stats.current)
            return {
                categoryId: id, name: stats.name, type: stats.type,
                avgMonthly: Math.round(avgMonthly * 100) / 100,
                currentMonth: Math.round(stats.current * 100) / 100,
                remainingPlanned: Math.round(remainingPlanned * 100) / 100,
                isOverBudget: stats.type !== 'REVENUE' && stats.current < avgMonthly
            }
        })

        const monthlyAverageRevenue = categories.filter(c => c.type === 'REVENUE').reduce((s, c) => s + c.avgMonthly, 0)
        const monthlyAverageExpenses = categories.filter(c => c.type !== 'REVENUE').reduce((s, c) => s + Math.abs(c.avgMonthly), 0)

        const avgFixedCosts = categories
            .filter(c => c.type === 'FIXED_COST' || c.type === 'SALARY' || c.type === 'FINANCIAL' || c.type === 'TAX')
            .reduce((s, c) => s + Math.abs(c.avgMonthly), 0)
        const avgVariableCosts = categories
            .filter(c => c.type === 'VARIABLE_COST' || c.type === 'INVESTMENT' || c.type === 'INTERNAL_TRANSFER' || c.type === 'TRANSIT')
            .reduce((s, c) => s + Math.abs(c.avgMonthly), 0)

        const grossMarginAmount = monthlyAverageRevenue - avgVariableCosts
        const grossMarginPercentage = monthlyAverageRevenue > 0 ? grossMarginAmount / monthlyAverageRevenue : 0
        const breakEvenPoint = grossMarginPercentage > 0 ? avgFixedCosts / grossMarginPercentage : 0

        const totalRemainingToSpend = categories.filter(c => c.type !== 'REVENUE').reduce((s, c) => s + c.remainingPlanned, 0)
        const totalRemainingRevenue = categories.filter(c => c.type === 'REVENUE').reduce((s, c) => s + c.remainingPlanned, 0)
        const projectedEndOfMonthBalance = currentBalance + totalRemainingToSpend + totalRemainingRevenue
        const expectedNetResult = monthlyAverageRevenue - monthlyAverageExpenses

        // 9. Day-of-month progress
        const currentDayOfMonth = getDate(now)
        const totalDaysInMonth = getDaysInMonth(now)
        const monthProgressPct = Math.round((currentDayOfMonth / totalDaysInMonth) * 100)

        // 10. Treasury alert — daily burn rate
        const currentNetFlow = categories.reduce((s, c) => s + c.currentMonth, 0)
        const dailyBurnRate = currentDayOfMonth > 0 ? currentNetFlow / currentDayOfMonth : 0
        let daysUntilZero: number | null = null
        if (dailyBurnRate < 0 && currentBalance > 0) {
            daysUntilZero = Math.floor(currentBalance / Math.abs(dailyBurnRate))
        }

        // 11. Health Score (0-100)
        let score = 0
        // Gross margin weight: 30pts (industry: >60% = 30, 40-60% = 20, <40% = 10)
        const gm = grossMarginPercentage * 100
        if (gm >= 60) score += 30
        else if (gm >= 40) score += 20
        else if (gm >= 20) score += 10

        // Break-even progress: 30pts
        const beProgress = breakEvenPoint > 0 ? monthlyAverageRevenue / breakEvenPoint : 0
        if (beProgress >= 1.2) score += 30
        else if (beProgress >= 1.0) score += 20
        else if (beProgress >= 0.8) score += 10

        // Net result margin: 20pts
        const netMargin = monthlyAverageRevenue > 0 ? expectedNetResult / monthlyAverageRevenue : 0
        if (netMargin >= 0.1) score += 20
        else if (netMargin >= 0.05) score += 12
        else if (netMargin >= 0) score += 6

        // Treasury buffer: 20pts
        const treasuryMonths = monthlyAverageExpenses > 0 ? currentBalance / monthlyAverageExpenses : 0
        if (treasuryMonths >= 3) score += 20
        else if (treasuryMonths >= 1.5) score += 12
        else if (treasuryMonths >= 0.5) score += 6

        const healthLabel =
            score >= 85 ? 'Excellent' :
                score >= 65 ? 'Sain' :
                    score >= 45 ? 'Équilibré' :
                        score >= 25 ? 'Fragile' : 'En Danger'

        // 12. Waterfall data
        const waterfallData = [
            { name: 'CA Moyen', value: Math.round(monthlyAverageRevenue), type: 'revenue' as const },
            { name: 'Mat. Premières', value: -Math.round(avgVariableCosts), type: 'expense' as const },
            { name: 'Marge Brute', value: Math.round(grossMarginAmount), type: 'result' as const },
            { name: 'Charges Fixes', value: -Math.round(avgFixedCosts), type: 'expense' as const },
            { name: 'Résultat Net', value: Math.round(expectedNetResult), type: 'result' as const },
        ]

        const historicalMonths = Array.from({ length: monthsToAverage }, (_, i) => {
            return format(subMonths(now, i + 1), 'MMMM yyyy', { locale: fr })
        }).reverse()

        const officialBaselines: OfficialBaselines[] = [
            { year: '2024', months: 16, ca: 476179, ebe: 31724, netResult: 20878, cashflow: 23356, payroll: 79820, costOfSales: 213576 },
            { year: '2025', months: 12, ca: 415995, ebe: 10038, netResult: 4526, cashflow: 8916, payroll: 107957, costOfSales: 178314 }
        ]

        return {
            monthlyAverageRevenue, monthlyAverageExpenses,
            avgFixedCosts, avgVariableCosts,
            breakEvenPoint, grossMarginPercentage, expectedNetResult,
            currentBalance, projectedEndOfMonthBalance,
            currentDayOfMonth, totalDaysInMonth, monthProgressPct,
            dailyBurnRate, daysUntilZero,
            healthScore: score, healthLabel,
            waterfallData, monthlyBreakdown,
            categories, historicalMonths, officialBaselines
        }

    } catch (error) {
        console.error("Error in getForecastData:", error)
        throw error
    }
}
