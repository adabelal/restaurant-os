'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { CashTransactionType } from "@prisma/client"
import * as XLSX from "xlsx"
import { requireAuth } from "@/lib/auth-utils"
import { safeAction } from "@/lib/safe-action"
import { cache } from "react"
import { createCashTransactionSchema, createCashCategorySchema } from "@/lib/validations"
import { z } from "zod"
import { Resend } from 'resend'
import { CAISSE_RULES } from "@/lib/finance-rules"

// Initialisation lazy de Resend pour éviter les erreurs au build
function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
        throw new Error("RESEND_API_KEY non configurée")
    }
    return new Resend(apiKey)
}

export const getCashTransactions = cache(async (filters: {
    startDate?: Date,
    endDate?: Date,
    categoryId?: string,
    type?: CashTransactionType,
    orderBy?: 'date' | 'createdAt'
} = {}) => {
    await requireAuth()

    const { startDate, endDate, categoryId, type, orderBy = 'date' } = filters

    return await prisma.cashTransaction.findMany({
        where: {
            date: {
                gte: startDate,
                lte: endDate
            },
            categoryId,
            type
        },
        include: {
            category: true,
            user: {
                select: { name: true }
            }
        },
        orderBy: { [orderBy]: 'desc' }
    })
})

export async function createCashTransaction(data: {
    date: Date,
    amount: number,
    type: CashTransactionType,
    description: string,
    categoryId?: string,
    userId?: string
}) {
    return safeAction(data, async (input) => {
        // Validation
        const result = createCashTransactionSchema.safeParse({
            amount: Math.abs(input.amount), // Validate magnitude
            type: input.type,
            description: input.description,
            categoryId: input.categoryId,
            date: input.date,
        })

        if (!result.success) {
            return { error: result.error.errors[0].message }
        }

        const finalAmount = input.type === 'OUT' ? -Math.abs(input.amount) : Math.abs(input.amount)

        await prisma.cashTransaction.create({
            data: {
                date: input.date,
                amount: finalAmount,
                type: input.type,
                description: input.description.trim(),
                categoryId: input.categoryId,
                userId: input.userId
            }
        })
        revalidatePath('/caisse')
        return { success: true }
    })
}

export async function updateCashTransaction(id: string, data: {
    date?: Date,
    amount?: number,
    type?: CashTransactionType,
    description?: string,
    categoryId?: string
}) {
    return safeAction({ id, data }, async (input) => {
        if (!input.id || typeof input.id !== "string") {
            return { error: "ID invalide" }
        }

        if (input.data.description !== undefined && input.data.description.trim().length === 0) {
            return { error: "La description est requise" }
        }

        // Fetch current transaction
        const currentTx = await prisma.cashTransaction.findUnique({ where: { id: input.id } })
        if (!currentTx) {
            return { error: "Transaction introuvable" }
        }

        const targetType = input.data.type || currentTx.type
        // Use absolutes to ensure consistent logic regardless of how it was stored
        const magnitude = input.data.amount !== undefined ? Math.abs(input.data.amount) : Math.abs(Number(currentTx.amount))

        const finalAmount = targetType === 'OUT' ? -magnitude : magnitude

        await prisma.cashTransaction.update({
            where: { id: input.id },
            data: {
                date: input.data.date,
                amount: finalAmount,
                type: input.data.type,
                description: input.data.description?.trim(),
                categoryId: input.data.categoryId
            }
        })
        revalidatePath('/caisse')
        return { success: true }
    })
}

export async function deleteCashTransaction(id: string) {
    return safeAction(id, async (input) => {
        if (!input || typeof input !== "string") {
            return { error: "ID invalide" }
        }

        try {
            await prisma.cashTransaction.delete({
                where: { id: input }
            })
            revalidatePath('/caisse')
            return { success: true, message: "Transaction supprimée." }
        } catch (error: any) {
            if (error.code === 'P2025') {
                return { error: "La transaction n'existe plus." }
            }
            console.error("Error deleting cash transaction:", error)
            return { error: "Erreur lors de la suppression de la transaction." }
        }
    })
}

export async function getAppSettings() {
    await requireAuth()

    return await prisma.appSettings.upsert({
        where: { id: 'global' },
        update: {},
        create: { id: 'global' }
    })
}

export async function updateAppSettings(data: { accountantEmail?: string }) {
    return safeAction(data, async (input) => {
        // Validation email si fourni
        if (input.accountantEmail) {
            const emailSchema = z.string().email()
            if (!emailSchema.safeParse(input.accountantEmail).success) {
                return { error: "Email invalide" }
            }
        }

        const settings = await prisma.appSettings.update({
            where: { id: 'global' },
            data: {
                accountantEmail: input.accountantEmail?.trim().toLowerCase()
            }
        })
        revalidatePath('/caisse')
        return { success: true, data: settings }
    })
}

export async function sendExportEmail(to: string, subject: string, fileName: string, base64Content: string) {
    return safeAction({ to, subject, fileName, base64Content }, async (input) => {
        // Validation email
        const emailSchema = z.string().email()
        if (!emailSchema.safeParse(input.to).success) {
            return { error: "Email invalide" }
        }

        // Validation du nom de fichier
        if (!input.fileName || input.fileName.length > 255) {
            return { error: "Nom de fichier invalide" }
        }

        // Validation du contenu
        if (!input.base64Content || input.base64Content.length > 10 * 1024 * 1024) { // Max 10MB
            return { error: "Fichier trop volumineux" }
        }

        try {
            const resend = getResendClient()
            const { data, error } = await resend.emails.send({
                from: 'Caisse Restaurant <onboarding@resend.dev>',
                to: [input.to],
                subject: input.subject.substring(0, 255), // Limiter la longueur du sujet
                text: `Veuillez trouver ci-joint l'export de la caisse : ${input.fileName}`,
                attachments: [
                    {
                        filename: input.fileName,
                        content: input.base64Content,
                    },
                ],
            })

            if (error) {
                console.error("Resend error:", error)
                return { error: error.message }
            }

            return { success: true, id: data?.id }
        } catch (err) {
            console.error("Email send failed:", err)
            return { error: "Erreur lors de l'envoi" }
        }
    })
}

export const getCashCategories = cache(async () => {
    await requireAuth()

    return await prisma.cashCategory.findMany({
        orderBy: { name: 'asc' }
    })
})

export async function createCashCategory(name: string, type: CashTransactionType, color?: string) {
    return safeAction({ name, type, color }, async (input) => {
        const result = createCashCategorySchema.safeParse(input)
        if (!result.success) {
            return { error: result.error.errors[0].message }
        }

        const category = await prisma.cashCategory.upsert({
            where: { name_type: { name: result.data.name.trim(), type: input.type } },
            update: { color: result.data.color },
            create: { name: result.data.name.trim(), type: input.type, color: result.data.color }
        })
        revalidatePath('/caisse')
        return { success: true, data: category }
    })
}

export async function deleteCashCategory(id: string) {
    return safeAction(id, async (input) => {
        if (!input || typeof input !== "string") {
            return { error: "ID invalide" }
        }

        await prisma.cashCategory.delete({
            where: { id: input }
        })
        revalidatePath('/caisse')
        return { success: true }
    })
}

export async function clearCaisseData() {
    return safeAction(null, async () => {
        await prisma.cashTransaction.deleteMany({})
        revalidatePath('/caisse')
        return { success: true }
    })
}

export async function importPopinaExcel(formData: FormData) {
    await requireAuth()

    try {
        const file = formData.get('file') as File
        if (!file) {
            return { success: false, error: "Aucun fichier fourni" }
        }

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ]
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            return { success: false, error: "Format de fichier invalide (Excel requis)" }
        }

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        
        // On récupère tout sous forme de tableau de tableaux (header: 1)
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

        if (rows.length < 2) {
            return { success: false, error: "Fichier Excel vide ou invalide" }
        }

        const mainHeader = rows[0]
        const dataRows = rows.slice(1)

        const dateIdx = mainHeader.findIndex(h => {
            const str = String(h).toLowerCase()
            return str.includes("début") || str.includes("debut") || str.includes("date")
        })
        const totalNetIdx = mainHeader.findIndex(h => String(h).toLowerCase().includes("total net"))
        const pourboireStartIdx = mainHeader.findIndex(h => String(h).toLowerCase().includes("pourboire"))

        if (dateIdx === -1) {
            return { success: false, error: "Colonne 'Début' ou 'Date' introuvable dans l'Excel" }
        }

        const subHeader = dataRows[0]
        const tipMapping: Record<string, number> = {}

        for (let i = pourboireStartIdx; i < subHeader.length; i++) {
            const h = String(subHeader[i]).toLowerCase()
            if (h.includes("espèces")) tipMapping["ESPECES"] = i
            if (h.includes("carte") || h.includes("cb")) tipMapping["CC"] = i
            if (h.includes("chèque") || h.includes("cheque")) tipMapping["CHEQUE"] = i
            if (h.includes("total pourboire")) break
        }

        let catRecettes = await prisma.financeCategory.findUnique({ where: { name: "Recettes" } })
        if (!catRecettes) {
            catRecettes = await prisma.financeCategory.create({ data: { name: "Recettes", type: "REVENUE", color: "emerald" } })
        }

        let catSocial = await prisma.financeCategory.findUnique({ where: { name: "Social" } })
        if (!catSocial) {
            catSocial = await prisma.financeCategory.create({ data: { name: "Social", type: "SALARY", color: "blue" } })
        }

        let transactionsCreated = 0

        for (let i = 1; i < dataRows.length; i++) {
            const row = dataRows[i]
            let dateVal = row[dateIdx]
            if (!dateVal) continue

            let date: Date
            if (typeof dateVal === 'number') {
                date = new Date((dateVal - 25569) * 86400 * 1000)
            } else {
                const parts = String(dateVal).split(/[\s/:]+/)
                if (parts.length >= 3) {
                    const day = parseInt(parts[0], 10)
                    const month = parseInt(parts[1], 10) - 1
                    const year = parseInt(parts[2], 10)
                    const hours = parts[3] ? parseInt(parts[3], 10) : 0
                    const mins = parts[4] ? parseInt(parts[4], 10) : 0
                    date = new Date(year, month, day, hours, mins)
                } else {
                    date = new Date(dateVal)
                }
            }

            if (isNaN(date.getTime())) continue

            // A. Recette Principale
            if (totalNetIdx !== -1) {
                const amount = Number(row[totalNetIdx])
                if (amount > 0) {
                    const desc = "Recette Popina (Total Net)"
                    const existing = await prisma.cashTransaction.findFirst({
                        where: {
                            date: {
                                gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                                lte: new Date(new Date(date).setHours(23, 59, 59, 999))
                            },
                            amount: amount,
                            description: desc
                        }
                    })

                    if (!existing) {
                        await prisma.cashTransaction.create({
                            data: {
                                date: date,
                                amount: amount,
                                type: "IN",
                                description: desc,
                                categoryId: catRecettes.id
                            }
                        })
                        transactionsCreated++
                    }
                }
            }

            // B. Pourboires
            const especeIdx = tipMapping["ESPECES"]
            if (especeIdx !== undefined && Number(row[especeIdx]) > 0) {
                const amount = Number(row[especeIdx])
                const descIn = `Popina: Pourboire Espèces (Entrée)`
                const descOut = `Popina: Pourboire Espèces (Sortie)`

                const existingIn = await prisma.cashTransaction.findFirst({
                    where: { date: date, amount: amount, description: descIn }
                })
                if (!existingIn) {
                    await prisma.cashTransaction.create({
                        data: { date: date, amount: amount, type: "IN", description: descIn, categoryId: catSocial.id }
                    })
                    transactionsCreated++
                }

                const existingOut = await prisma.cashTransaction.findFirst({
                    where: { date: date, amount: -amount, description: descOut }
                })
                if (!existingOut) {
                    await prisma.cashTransaction.create({
                        data: { date: date, amount: -amount, type: "OUT", description: descOut, categoryId: catSocial.id }
                    })
                    transactionsCreated++
                }
            }

            const ccIdx = tipMapping["CC"]
            if (ccIdx !== undefined && Number(row[ccIdx]) > 0) {
                const amount = Number(row[ccIdx])
                const desc = `Popina: Pourboire Carte (Sortie)`
                const existing = await prisma.cashTransaction.findFirst({
                    where: { date: date, amount: -amount, description: desc }
                })
                if (!existing) {
                    await prisma.cashTransaction.create({
                        data: { date: date, amount: -amount, type: "OUT", description: desc, categoryId: catSocial.id }
                    })
                    transactionsCreated++
                }
            }

            const chequeIdx = tipMapping["CHEQUE"]
            if (chequeIdx !== undefined && Number(row[chequeIdx]) > 0) {
                const amount = Number(row[chequeIdx])
                const desc = `Popina: Pourboire Chèque (Sortie)`
                const existing = await prisma.cashTransaction.findFirst({
                    where: { date: date, amount: -amount, description: desc }
                })
                if (!existing) {
                    await prisma.cashTransaction.create({
                        data: { date: date, amount: -amount, type: "OUT", description: desc, categoryId: catSocial.id }
                    })
                    transactionsCreated++
                }
            }
        }

        revalidatePath('/caisse')
        return { success: true, count: transactionsCreated }
    } catch (error: any) {
        console.error("Popina Import Error:", error)
        return { success: false, error: "Erreur lors de l'import: " + error.message }
    }
}

export async function importCaisseFromExcel(formData: FormData) {
    await requireAuth()

    try {
        const file = formData.get('file') as File
        if (!file) {
            return { success: false, error: "Aucun fichier fourni" }
        }

        // Validation de la taille du fichier (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return { success: false, error: "Fichier trop volumineux (max 5MB)" }
        }

        // Validation du type de fichier
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ]
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            return { success: false, error: "Format de fichier invalide (Excel requis)" }
        }

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { cellDates: true })

        const catMapStrings = CAISSE_RULES.categoryMapping

        const transactionsToCreate: any[] = []
        const categoriesIn = new Set<string>()
        const categoriesOut = new Set<string>()

        const sheetName = workbook.SheetNames.find(n =>
            ["caisse", "entrées", "entrees"].some(k => n.toLowerCase().includes(k))
        ) || workbook.SheetNames[0]

        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)

        // Limiter le nombre de lignes importées
        const maxRows = 10000
        const dataSlice = data.slice(0, maxRows)

        for (const r of dataSlice) {
            const row = r as any
            const date = row['Date'] || row['DATE']
            const libelle = row['Libellé'] || row['LIBELLE'] || row['Description']

            const sortiesValue = row['SORTIES'] || row['Sorties'] || row['Sortie']
            const entreesValue = row['ENTREES'] || row['Entrées'] || row['Entrée']

            if (!date || (!sortiesValue && !entreesValue)) continue

            let amount = 0
            let type: CashTransactionType = 'IN'

            if (entreesValue && (isNaN(parseFloat(sortiesValue)) || parseFloat(sortiesValue) === 0)) {
                amount = Math.abs(parseFloat(entreesValue))
                type = 'IN'
            } else if (sortiesValue) {
                amount = -Math.abs(parseFloat(sortiesValue))
                type = 'OUT'
            }

            if (isNaN(amount) || amount === 0) continue

            let category = "Autre"
            for (const [key, val] of Object.entries(catMapStrings)) {
                if (String(libelle).toLowerCase().includes(key.toLowerCase())) {
                    category = String(val)
                    break
                }
            }

            if (type === 'IN') categoriesIn.add(category)
            else categoriesOut.add(category)

            transactionsToCreate.push({
                date: new Date(date),
                description: String(libelle).substring(0, 255), // Limiter la longueur
                amount,
                type,
                categoryName: category
            })
        }

        // Add Logic for separate "Sorties" sheet if it exists
        const outSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes("sorties"))
        if (outSheetName && outSheetName !== sheetName) {
            const outWorksheet = workbook.Sheets[outSheetName]
            const outData = XLSX.utils.sheet_to_json(outWorksheet).slice(0, maxRows)

            for (const r of outData) {
                const row = r as any
                const date = row['Date'] || row['DATE']
                const libelle = row['Libellé'] || row['LIBELLE'] || row['Description']
                const amount = parseFloat(row['Montant'] || row['SORTIES'] || row['Sorties'])

                if (!date || isNaN(amount) || amount === 0) continue

                let category = "Autre"
                for (const [key, val] of Object.entries(catMapStrings)) {
                    if (String(libelle).toLowerCase().includes(key.toLowerCase())) {
                        category = String(val)
                        break
                    }
                }
                categoriesOut.add(category)
                transactionsToCreate.push({
                    date: new Date(date),
                    description: String(libelle).substring(0, 255),
                    amount: -Math.abs(amount), // Force negative for OUT
                    type: 'OUT',
                    categoryName: category
                })
            }
        }

        // Création des catégories
        for (const catName of Array.from(categoriesIn)) {
            await prisma.cashCategory.upsert({
                where: { name_type: { name: catName, type: 'IN' } },
                update: {},
                create: { name: catName, type: 'IN' }
            })
        }
        for (const catName of Array.from(categoriesOut)) {
            await prisma.cashCategory.upsert({
                where: { name_type: { name: catName, type: 'OUT' } },
                update: {},
                create: { name: catName, type: 'OUT' }
            })
        }

        const allCats = await prisma.cashCategory.findMany()
        const catIdMap = new Map(allCats.map((c: any) => [`${c.name}-${c.type}`, c.id]))

        // Insertion par batch
        for (const t of transactionsToCreate) {
            await prisma.cashTransaction.create({
                data: {
                    date: t.date,
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    categoryId: catIdMap.get(`${t.categoryName}-${t.type}`)
                }
            })
        }

        revalidatePath('/caisse')
        return { success: true, count: transactionsToCreate.length }
    } catch (error) {
        console.error("Import failed:", error)
        return { success: false, error: "Erreur lors de l'import" }
    }
}
