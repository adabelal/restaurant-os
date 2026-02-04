'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// FINANCE STATS WITH AUTO-REPAIR
export async function getFinanceStats() {
    // AUTO-REPAIR: If DB is empty, import from history_data.json
    try {
        const count = await prisma.bankTransaction.count()
        if (count === 0) {
            console.log("DB Empty inside getFinanceStats. Triggering auto-import...")
            await importFromJsonFile()
        }
    } catch (e) {
        console.error("Auto-repair check failed:", e)
    }

    const today = new Date()
    const currentDay = today.getDate()

    // 1. Calculate Current Balance from Bank Transactions
    const transactions = await prisma.bankTransaction.findMany({
        select: { amount: true }
    })
    // Ensure we handle Decimal properly if using Prisma Decimal
    const currentBalance = transactions.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

    // 2. Fixed Costs
    const fixedCosts = await prisma.fixedCost.findMany()

    // Total monthly lissés
    const monthlyFixedCost = fixedCosts.reduce((sum: number, cost: any) => {
        const amount = Number(cost.amount || 0)
        switch (cost.frequency) {
            case 'MONTHLY': return sum + amount
            case 'QUARTERLY': return sum + (amount / 3)
            case 'YEARLY': return sum + (amount / 12)
            default: return sum
        }
    }, 0)

    // Remaining fixed costs for THIS month
    const remainingFixedCosts = fixedCosts
        .filter((cost: any) => cost.frequency === 'MONTHLY' && cost.dayOfMonth > currentDay && cost.isActive)
        .reduce((sum: number, cost: any) => sum + Number(cost.amount || 0), 0)

    // 3. Unpaid Purchase Orders (Not reconciled with bank)
    const unpaidPOs = await prisma.purchaseOrder.findMany({
        where: {
            bankTransactions: {
                none: {}
            }
        },
        select: { id: true, totalAmount: true }
    })
    const totalUnpaidPOs = unpaidPOs.reduce((sum: number, po: any) => sum + Number(po.totalAmount || 0), 0)

    // 4. Projection Fin de Mois
    const eomForecast = currentBalance - remainingFixedCosts - totalUnpaidPOs

    // 5. Last 5 Transactions for preview
    const recentTransactions = await prisma.bankTransaction.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: { category: true }
    })

    // 6. Chart Data
    const chartData = await getBalanceChartData()

    return {
        currentBalance,
        monthlyFixedCost,
        remainingFixedCosts,
        totalUnpaidPOs,
        unpaidPOs,
        eomForecast,
        recentTransactions,
        chartData
    }
}

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
        // Fetch costs and categories separately to avoid Relation errors if data is inconsistent
        const [costs, categories] = await Promise.all([
            prisma.fixedCost.findMany({
                orderBy: { dayOfMonth: 'asc' }
            }),
            prisma.financeCategory.findMany()
        ])

        // Manual Join
        const enrichedCosts = costs.map(cost => {
            const category = categories.find(c => c.id === cost.categoryId) || {
                id: 'unknown',
                name: 'Non catégorisé',
                type: 'FIXED_COST',
                color: 'slate',
                description: null,
                createdAt: new Date(),
                updatedAt: new Date()
            }
            return {
                ...cost,
                category
            }
        })

        return enrichedCosts
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

        // 2. Cleanup Legacy Adjustments (Fix for 32k balance issue)
        // We previously added a 26k adjustment. Now that history is perfect, we must remove it.
        await prisma.bankTransaction.deleteMany({
            where: { description: "RAPPORT DE SOLDE INITIAL" }
        })

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

        return { success: true }
    } catch (error) {
        console.error("Sync error:", error)
        return { success: false, error: String(error) }
    }
}

export async function importHistoricalData(transactions: any[]) {
    try {
        console.log("Wiping existing transactions...")
        await prisma.bankTransaction.deleteMany({})

        console.log(`Starting import of ${transactions.length} entries...`)

        // Batch import in chunks of 100
        const CHUNK_SIZE = 100
        for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
            const chunk = transactions.slice(i, i + CHUNK_SIZE).map(tx => ({
                date: new Date(tx.date),
                amount: tx.amount,
                description: tx.description,
                status: 'PENDING'
            }))

            await prisma.bankTransaction.createMany({
                data: chunk
            })
        }

        revalidatePath('/finance')
        return { success: true, count: transactions.length }
    } catch (error) {
        console.error("Import error:", error)
        return { success: false, error: String(error) }
    }
}

export async function importFromJsonFile() {
    try {
        const fs = require('fs')
        const path = require('path')
        const filePath = path.join(process.cwd(), 'history_data.json')

        if (!fs.existsSync(filePath)) {
            return { success: false, error: "history_data.json non trouvé sur le serveur" }
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        return await importHistoricalData(data)
    } catch (error) {
        console.error("JSON Import error:", error)
        return { success: false, error: String(error) }
    }
}
