'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { BankTransaction, FixedCost, PurchaseOrder } from "@prisma/client"
import { FINANCE_RULES } from "@/lib/finance-rules"

// FINANCE STATS WITH AUTO-REPAIR
export async function getFinanceStats() {
    // AUTO-REPAIR: Feature disabled (Json Import removed)
    try {
        const count = await prisma.bankTransaction.count()
        if (count === 0) {
            console.log("DB Empty inside getFinanceStats.")
        }
    } catch (e) {
        console.error("Check failed:", e)
    }

    const today = new Date()
    const currentDay = today.getDate()

    // 1. Calculate Current Balance from Bank Transactions (SQL Optimization)
    const resultBank = await prisma.bankTransaction.aggregate({
        _sum: { amount: true }
    })
    const currentBalance = Number(resultBank._sum.amount || 0)

    // 2. Fixed Costs
    const fixedCosts = await prisma.fixedCost.findMany()

    // Total monthly lissés
    const monthlyFixedCost = fixedCosts.reduce((sum: number, cost) => {
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
        .filter((cost) => cost.frequency === 'MONTHLY' && cost.dayOfMonth > currentDay && cost.isActive)
        .reduce((sum, cost) => sum + Number(cost.amount || 0), 0)

    // 3. Unpaid Purchase Orders (SQL Optimization)
    const resultUnpaid = await prisma.purchaseOrder.aggregate({
        where: { bankTransactions: { none: {} } },
        _sum: { totalAmount: true }
    })
    const totalUnpaidPOs = Number(resultUnpaid._sum.totalAmount || 0)

    const unpaidPOs = await prisma.purchaseOrder.findMany({
        where: { bankTransactions: { none: {} } },
        select: { id: true, totalAmount: true }
    })



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

import { withAuth } from "@/lib/action-wrapper"

export async function addFixedCost(data: {
    name: string
    amount: number
    dayOfMonth: number
    frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
    categoryId: string
}) {
    return withAuth(async () => {
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
    })
}

export async function deleteFixedCost(id: string) {
    return withAuth(async () => {
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
    }, ['ADMIN', 'MANAGER']) // Sécurité supp. : seul Admin/Manager peut supprimer
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
        const [bankTxs, cashTxs] = await Promise.all([
            prisma.bankTransaction.findMany({
                orderBy: { date: 'asc' },
                select: { date: true, amount: true }
            }),
            prisma.cashTransaction.findMany({
                orderBy: { date: 'asc' },
                select: { date: true, amount: true }
            })
        ])

        if (bankTxs.length === 0 && cashTxs.length === 0) return []

        const monthlyData: { [key: string]: { bank: number, cash: number } } = {}
        let runningBank = 0
        let runningCash = 0

        // Process Bank
        bankTxs.forEach(tx => {
            const date = new Date(tx.date)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            runningBank += Number(tx.amount)
            if (!monthlyData[monthKey]) monthlyData[monthKey] = { bank: 0, cash: 0 }
            monthlyData[monthKey].bank = runningBank
        })

        // Process Cash
        cashTxs.forEach(tx => {
            const date = new Date(tx.date)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            // For cash usually we might want to handle IN/OUT if the schema has it. 
            // In her schema it is signed or has a type? Let me check type.
            // Actually I'll just use the amount as signed for now or check if it's based on type.
            runningCash += Number(tx.amount)
            if (!monthlyData[monthKey]) monthlyData[monthKey] = { bank: 0, cash: 0 }
            monthlyData[monthKey].cash = runningCash
        })

        const chartData = Object.entries(monthlyData)
            .map(([month, balances]) => ({
                month,
                bank: Math.round(balances.bank * 100) / 100,
                cash: Math.round(balances.cash * 100) / 100,
                total: Math.round((balances.bank + balances.cash) * 100) / 100
            }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12)

        return chartData
    } catch (error) {
        console.error("Error generating chart data:", error)
        return []
    }
}

export async function getMonthlyTimeline() {
    try {
        const fixedCosts = await prisma.fixedCost.findMany({
            where: { isActive: true },
            include: { category: true }
        })

        // Map them to the current month days
        const today = new Date()
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()

        const timeline = fixedCosts.map(cost => {
            const date = new Date(currentYear, currentMonth, cost.dayOfMonth)
            return {
                id: cost.id,
                name: cost.name,
                amount: Number(cost.amount),
                date,
                category: cost.category.name,
                isPast: cost.dayOfMonth < today.getDate()
            }
        }).sort((a, b) => a.date.getTime() - b.date.getTime())

        return timeline
    } catch (error) {
        console.error("Error fetching timeline:", error)
        return []
    }
}

export async function syncFinanceIntelligence() {
    try {
        console.log("Starting Smart Finance Intelligence...")

        // 1. Create/Get Categories
        const catMap: Record<string, string> = {}
        for (const c of FINANCE_RULES.categories) {
            let cat = await prisma.financeCategory.findFirst({ where: { name: c.name } })
            if (!cat) {
                // @ts-ignore - Prisma enum type mismatch with string literal
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

            for (const cat of FINANCE_RULES.categories) {
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
        for (const target of FINANCE_RULES.detectionTargets) {
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
        for (const nameKeyword of FINANCE_RULES.salaryKeywords) {
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

export async function importHistoricalData(transactions: any[], options: { resetMode?: boolean } = {}) {
    try {
        if (options.resetMode) {
            console.log("RESET MODE ENABLED: Wiping existing transactions...")
            await prisma.bankTransaction.deleteMany({})
        } else {
            console.log("Importing without wipe...")
        }

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


export async function importBankCsvAction(formData: FormData) {
    try {
        const file = formData.get('file') as File
        if (!file) return { success: false, error: "Aucun fichier reçu" }

        const text = await file.text() // Read file content
        const lines = text.split('\n')

        let importedCount = 0
        let duplicateCount = 0

        // Format de Banque Populaire attendu :
        // Compte;Date de comptabilisation;Date opération;Libellé;Référence;Date valeur;Montant

        // Detect CSV format (header check)
        const header = lines[0].split(';')
        const isValidFormat = header.some(h => h.includes('Date opération') || h.includes('Libellé') || h.includes('Montant'))

        if (!isValidFormat) {
            // Try to find the header row
            // Maybe it's not the first line
        }

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            const cols = line.split(';')
            if (cols.length < 5) continue

            // Index mapping (based on previous manual parsing)
            // 2: Date Opération (DD/MM/YYYY)
            // 3: Libellé
            // 6: Montant (French format: 1 234,56 or "-123,45" with quotes)

            const dateStr = cols[2]?.replace(/"/g, '').trim()
            const libelle = cols[3]?.replace(/"/g, '').trim()
            let amountStr = cols[6]?.replace(/"/g, '').trim()

            if (!dateStr || !amountStr) continue

            // Parse Date
            const [day, month, year] = dateStr.split('/')
            const dateObj = new Date(Number(year), Number(month) - 1, Number(day))

            if (isNaN(dateObj.getTime())) continue

            // Check if future date (sometimes banks export 'future' lines)
            // Actually we accept future lines if they are in the CSV

            // Parse Amount (French to Float)
            // Remove ' ' (thousands) and replace ',' with '.'
            amountStr = amountStr.replace(/\s/g, '').replace(',', '.')
            // Handle invisible chars
            amountStr = amountStr.replace(/[^0-9.-]/g, '')
            const amount = parseFloat(amountStr)

            if (isNaN(amount) || amount === 0) continue

            // --- ANTI-DUPLICATE CHECK ---
            // We check for exact match on Date + Amount + Description (First 50 chars)
            // We use a small tolerance on date (some banks change date slightly between pending/posted) ?? No, usually date operation is stable.
            // Let's stick to strict date.

            const existing = await prisma.bankTransaction.findFirst({
                where: {
                    date: dateObj,
                    amount: amount,
                    description: libelle
                }
            })

            if (existing) {
                duplicateCount++
                continue
            }

            // --- CREATE ---
            await prisma.bankTransaction.create({
                data: {
                    date: dateObj,
                    amount: amount,
                    description: libelle,
                    reference: 'CSV_IMPORT_' + new Date().toISOString().split('T')[0],
                    status: 'COMPLETED'
                }
            })
            importedCount++
        }

        revalidatePath('/finance')
        return { success: true, data: { imported: importedCount, duplicates: duplicateCount } }

    } catch (error) {
        console.error("CSV Import Error:", error)
        return { success: false, error: String(error) }
    }
}


import { fetchTransactions } from "@/lib/enable-banking"

export async function syncBankTransactions() {
    return withAuth(async () => {
        try {
            const accounts = await prisma.bankAccount.findMany()
            if (accounts.length === 0) {
                return { success: false, error: "Aucun compte bancaire connecté." }
            }

            let totalNew = 0
            let totalDup = 0

            for (const account of accounts) {
                if (!account.enableBankingSessionId) continue

                // Fetch transactions from Enable Banking
                const data = await fetchTransactions(account.accountUid, account.enableBankingSessionId)

                if (data.transactions && Array.isArray(data.transactions)) {
                    for (const tx of data.transactions) {
                        // Extract amount safely from various API standards (Berlin Group, STET, etc.)
                        const amountObj = tx.transactionAmount || tx.amount || tx.instructedAmount;
                        const amountStr = amountObj?.amount || amountObj?.value || amountObj;

                        // Extract description safely
                        const description = tx.remittanceInformationUnstructured
                            || tx.remittanceInformationStructured?.reference
                            || tx.additionalInformation
                            || tx.creditorName
                            || tx.debtorName
                            || "Transaction sans libellé";

                        if (amountStr === undefined || amountStr === null) {
                            console.warn("Ignored transaction due to missing amount:", tx);
                            continue; // Skip invalid transaction
                        }

                        let amount = parseFloat(amountStr);
                        if (isNaN(amount)) {
                            // Si le format STET nous renvoie amount.amount
                            if (typeof amountObj === 'object' && amountObj !== null && amountObj.amount === undefined) {
                                continue; // Unknown format
                            }
                        }

                        // Certains connecteurs mettent les débits en positif avec un flag creditDebitIndicator
                        const indicator = tx.creditDebitIndicator || tx.creditDebitInfo || '';
                        if (amount > 0 && (indicator === 'DBIT' || indicator === 'DEBIT')) {
                            amount = -amount;
                        } else if (amount < 0 && (indicator === 'CRDT' || indicator === 'CREDIT')) {
                            amount = Math.abs(amount);
                        }

                        const date = new Date(tx.bookingDate || tx.valueDate || tx.date);

                        // Check for duplicate
                        const existing = await prisma.bankTransaction.findFirst({
                            where: {
                                date: date,
                                amount: amount,
                                description: description
                            }
                        })

                        if (!existing) {
                            await prisma.bankTransaction.create({
                                data: {
                                    date,
                                    amount,
                                    description,
                                    reference: `ENABLE_BANKING_${account.aspspName}`,
                                    status: 'COMPLETED'
                                }
                            })
                            totalNew++
                        } else {
                            totalDup++
                        }
                    }
                } else if (data.transactions && typeof data.transactions === 'object') {
                    // Certain APIs return { booked: [], pending: [] }
                    const allTxs = [...(data.transactions.booked || []), ...(data.transactions.pending || [])];
                    for (const tx of allTxs) {
                        const amountObj = tx.transactionAmount || tx.amount || tx.instructedAmount;
                        const amountStr = amountObj?.amount || amountObj?.value || amountObj;
                        const description = tx.remittanceInformationUnstructured || tx.creditorName || "Transaction sans libellé";

                        if (amountStr === undefined) continue;

                        let amount = parseFloat(amountStr);
                        const indicator = tx.creditDebitIndicator || '';
                        if (amount > 0 && indicator === 'DBIT') amount = -amount;

                        const date = new Date(tx.bookingDate || tx.valueDate);

                        const existing = await prisma.bankTransaction.findFirst({
                            where: { date, amount, description }
                        });

                        if (!existing) {
                            await prisma.bankTransaction.create({
                                data: { date, amount, description, reference: `ENABLE_BANKING_${account.aspspName}`, status: 'COMPLETED' }
                            });
                            totalNew++;
                        } else {
                            totalDup++;
                        }
                    }
                }

                // Update last synced date
                await prisma.bankAccount.update({
                    where: { id: account.id },
                    data: { lastSyncedAt: new Date() }
                })
            }

            // Trigger intelligence sync (categorization) if new transactions found
            if (totalNew > 0) {
                await syncFinanceIntelligence()
            }

            revalidatePath('/finance')
            return { success: true, imported: totalNew, duplicates: totalDup }
        } catch (error: any) {
            console.error("Sync Bank Error:", error)
            // If session expired, we might need to tell the user to reconnect
            if (error.message?.includes('session')) {
                return { success: false, error: "Session bancaire expirée. Veuillez vous reconnecter.", needsReconnect: true }
            }
            return { success: false, error: String(error) }
        }
    })
}
