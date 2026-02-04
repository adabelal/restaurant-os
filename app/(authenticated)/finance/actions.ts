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
        console.log("Starting Smart Finance Intelligence...")

        // 1. Define Categories to Ensure
        const categories = [
            { name: 'Loyer & Charges', type: 'FIXED_COST', keywords: ['SCI BAB', 'LOYER'] },
            { name: 'Salaires & Rémunérations', type: 'SALARY', keywords: ['BELAL', 'SALAIRE', 'REMUNERATION', 'ROSSE', 'LEROY'] },
            { name: 'Expert Comptable', type: 'FIXED_COST', keywords: ['SC EXPERT', 'COMPTABLE', 'FIDUCIAIRE'] },
            { name: 'Frais Bancaires', type: 'FINANCIAL', keywords: ['COTISATION', 'COMMISSION', 'FRAIS'] },
            { name: 'Assurances', type: 'FIXED_COST', keywords: ['GROUPAMA', 'ASSURANCE', 'AXA', 'MAAF'] },
            { name: 'Télécom & Tech', type: 'FIXED_COST', keywords: ['ORANGE', 'FREE', 'SFR', 'BOUYGUES', 'OVH'] },
            { name: 'Leasing & Crédit', type: 'FINANCIAL', keywords: ['CAPIT', 'LEASE', 'CREDIT', 'LOCAM'] },
            { name: 'Fournisseurs', type: 'VARIABLE_COST', keywords: ['METRO', 'PROMUS', 'CARREFOUR'] },
            { name: 'Impôts & Taxes', type: 'TAX', keywords: ['DGFIP', 'SIE', 'CFE', 'TVA'] },
            { name: 'Social', type: 'SOCIAL', keywords: ['URSSAF', 'RETRAITE', 'PREVOYANCE'] }
        ]

        // 2. Create/Get Categories
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

        // 3. Smart Categorization of Transactions
        // We look for uncategorized transactions and try to match keywords
        const uncategorized = await prisma.bankTransaction.findMany({
            where: { categoryId: null }
        })

        for (const tx of uncategorized) {
            const desc = tx.description.toUpperCase()
            let matchedCatId = null

            for (const cat of categories) {
                if (cat.keywords.some(k => desc.includes(k))) {
                    matchedCatId = catMap[cat.name]
                    break
                }
            }

            if (matchedCatId) {
                await prisma.bankTransaction.update({
                    where: { id: tx.id },
                    data: { categoryId: matchedCatId }
                })
            }
        }

        // 4. Detect Recurring Fixed Costs (The "Expert" Logic)
        // We look for transactions in specific categories that happen regularly
        const detectionTargets = [
            { catName: 'Loyer & Charges', name: 'Loyer Commercial (SCI BAB)' },
            { catName: 'Expert Comptable', name: 'Expert Comptable (SC EXPERT)' },
            { catName: 'Frais Bancaires', name: 'Frais Tenue de Compte' },
            { catName: 'Leasing & Crédit', name: 'Leasing Matériel (CAPIT)' },
            { catName: 'Télécom & Tech', name: 'Abonnement Internet' },
            { catName: 'Assurances', name: 'Assurance Multirisque' }
        ]

        for (const target of detectionTargets) {
            const catId = catMap[target.catName]
            if (!catId) continue

            // Find last 3 transactions for this category to estimate amount
            const history = await prisma.bankTransaction.findMany({
                where: { categoryId: catId, amount: { lt: 0 } }, // Only expenses
                orderBy: { date: 'desc' },
                take: 5
            })

            if (history.length >= 2) {
                // Calculate average amount
                const avgAmount = Math.abs(history.reduce((sum, t) => sum + Number(t.amount), 0) / history.length)
                // Determine day of month (based on most recent)
                const dayOfMonth = new Date(history[0].date).getDate()

                // Upsert Fixed Cost
                const existingCost = await prisma.fixedCost.findFirst({
                    where: { name: target.name }
                })

                if (!existingCost) {
                    await prisma.fixedCost.create({
                        data: {
                            name: target.name,
                            amount: avgAmount,
                            dayOfMonth: dayOfMonth,
                            frequency: 'MONTHLY',
                            isActive: true,
                            categoryId: catId
                        }
                    })
                    console.log(`Detected and created fixed cost: ${target.name} - ${avgAmount}€`)
                }
            }
        }

        // 5. Detect Salaries (Specific logic per person)
        const salaryKeywords = ['BELAL', 'ROSSE', 'LEROY']
        for (const nameKeyword of salaryKeywords) {
            const salaryTx = await prisma.bankTransaction.findMany({
                where: {
                    description: { contains: nameKeyword, mode: 'insensitive' },
                    amount: { lt: 0 }
                },
                orderBy: { date: 'desc' },
                take: 5
            })

            if (salaryTx.length >= 3) {
                const avgSalary = Math.abs(salaryTx.reduce((sum, t) => sum + Number(t.amount), 0) / salaryTx.length)
                const costName = `Salaire - ${nameKeyword.charAt(0).toUpperCase() + nameKeyword.slice(1).toLowerCase()}`

                const existingSalary = await prisma.fixedCost.findFirst({ where: { name: costName } })
                if (!existingSalary) {
                    await prisma.fixedCost.create({
                        data: {
                            name: costName,
                            amount: avgSalary,
                            dayOfMonth: 5, // Default for salaries usually
                            frequency: 'MONTHLY',
                            isActive: true,
                            categoryId: catMap['Salaires & Rémunérations']
                        }
                    })
                }
            }
        }

        revalidatePath('/finance')
        revalidatePath('/finance/charges')
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
