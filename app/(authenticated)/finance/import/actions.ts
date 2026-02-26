'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as XLSX from 'xlsx'
import { FINANCE_RULES } from "@/lib/finance-rules"

export async function uploadBankStatement(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { success: false, error: "Aucun fichier fourni" }

    try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

        if (!rows || rows.length < 2) return { success: false, error: "Fichier vide ou format incorrect" }

        // Heuristic to find columns
        const headerRow = rows[0].map((c: any) => String(c).toLowerCase())

        let dateIdx = headerRow.findIndex((h: string) => h.includes('date'))
        let labelIdx = headerRow.findIndex((h: string) => h.includes('libell') || h.includes('label') || h.includes('description') || h.includes('op'))
        let amountIdx = headerRow.findIndex((h: string) => (h.includes('montant') || h.includes('solde')) && !h.includes('devise'))

        let debitIdx = headerRow.findIndex((h: string) => h.includes('debit'))
        let creditIdx = headerRow.findIndex((h: string) => h.includes('credit'))

        if (dateIdx === -1) return { success: false, error: "Colonne 'Date' introuvable dans l'en-tête" }
        if (labelIdx === -1) return { success: false, error: "Colonne 'Libellé' ou 'Description' introuvable" }

        if (amountIdx === -1 && (debitIdx === -1 || creditIdx === -1)) {
            return { success: false, error: "Colonne 'Montant' (ou Débit/Crédit) introuvable" }
        }

        let importedCount = 0

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (!row[dateIdx] && !row[labelIdx]) continue

            let amount = 0
            if (debitIdx !== -1 && creditIdx !== -1) {
                const debit = parseAmount(row[debitIdx])
                const credit = parseAmount(row[creditIdx])
                amount = credit - debit
            } else if (amountIdx !== -1) {
                amount = parseAmount(row[amountIdx])
            }

            if (isNaN(amount) || amount === 0) continue

            const dateVal = row[dateIdx]
            let date = new Date()
            if (typeof dateVal === 'number') {
                date = new Date(Math.round((dateVal - 25569) * 86400 * 1000))
            } else {
                const parts = String(dateVal).split('/')
                if (parts.length === 3) {
                    date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
                } else {
                    date = new Date(dateVal)
                }
            }

            if (isNaN(date.getTime())) continue

            const description = String(row[labelIdx]).trim()

            const existing = await prisma.bankTransaction.findFirst({
                where: {
                    date: date,
                    amount: amount,
                    description: description
                }
            })

            if (!existing) {
                const absAmount = Math.abs(amount)
                const dateStart = new Date(date)
                dateStart.setDate(dateStart.getDate() - 15)
                const dateEnd = new Date(date)
                dateEnd.setDate(dateEnd.getDate() + 15)

                let purchaseOrderId: string | undefined = undefined
                let categoryId: string | undefined = undefined

                if (amount < 0) {
                    // 1. Reconciliation logic
                    const potentialMatch = await prisma.purchaseOrder.findFirst({
                        where: {
                            totalAmount: absAmount,
                            date: { gte: dateStart, lte: dateEnd },
                            bankTransactions: { none: {} }
                        }
                    })

                    if (potentialMatch) {
                        purchaseOrderId = potentialMatch.id
                    }

                    // 2. Smart Categorization
                    const descriptionUpper = description.toUpperCase()

                    // Priority 1: Exact match with Fixed Costs
                    const fixedCharge = await prisma.fixedCost.findFirst({
                        where: {
                            isActive: true,
                            OR: [
                                { name: { contains: description, mode: 'insensitive' } }
                            ]
                        }
                    })

                    if (fixedCharge) {
                        categoryId = fixedCharge.categoryId
                    } else {
                        // Priority 2: Generic patterns
                        // Priority 2: Generic patterns
                        const categories = await prisma.financeCategory.findMany()
                        const catMap = new Map(categories.map(c => [c.name, c.id]))

                        for (const catRule of FINANCE_RULES.categories) {
                            if (catRule.keywords.some(k => descriptionUpper.includes(k))) {
                                const foundId = catMap.get(catRule.name)
                                if (foundId) {
                                    categoryId = foundId
                                    break
                                }
                            }
                        }
                    }
                }

                await prisma.bankTransaction.create({
                    data: {
                        date,
                        amount,
                        description,
                        status: purchaseOrderId ? 'RECONCILED' : 'PENDING',
                        purchaseOrderId,
                        categoryId
                    }
                })
                importedCount++
            }
        }

        revalidatePath('/finance')
        return { success: true, count: importedCount }

    } catch (e) {
        console.error("Upload error:", e)
        return { success: false, error: "Erreur lors de l'analyse du fichier." }
    }
}

function parseAmount(val: any): number {
    if (!val) return 0
    if (typeof val === 'number') return val
    let str = String(val).replace(/\s/g, '').replace('€', '')
    str = str.replace(',', '.')
    return parseFloat(str) || 0
}
