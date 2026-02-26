'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { CashTransactionType } from "@prisma/client"
import * as XLSX from "xlsx"
import { requireAuth } from "@/lib/auth-utils"
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

export async function getCashTransactions(filters: {
    startDate?: Date,
    endDate?: Date,
    categoryId?: string,
    type?: CashTransactionType,
    orderBy?: 'date' | 'createdAt'
} = {}) {
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
}

export async function createCashTransaction(data: {
    date: Date,
    amount: number,
    type: CashTransactionType,
    description: string,
    categoryId?: string,
    userId?: string
}) {
    await requireAuth()

    // Validation
    const result = createCashTransactionSchema.safeParse({
        amount: Math.abs(data.amount), // Validate magnitude
        type: data.type,
        description: data.description,
        categoryId: data.categoryId,
        date: data.date,
    })

    if (!result.success) {
        throw new Error(result.error.errors[0].message)
    }

    const finalAmount = data.type === 'OUT' ? -Math.abs(data.amount) : Math.abs(data.amount)

    const transaction = await prisma.cashTransaction.create({
        data: {
            date: data.date,
            amount: finalAmount,
            type: data.type,
            description: data.description.trim(),
            categoryId: data.categoryId,
            userId: data.userId
        }
    })
    revalidatePath('/caisse')
    return transaction
}

export async function updateCashTransaction(id: string, data: {
    date?: Date,
    amount?: number,
    type?: CashTransactionType,
    description?: string,
    categoryId?: string
}) {
    await requireAuth()

    if (!id || typeof id !== "string") {
        throw new Error("ID invalide")
    }

    if (data.description !== undefined && data.description.trim().length === 0) {
        throw new Error("La description est requise")
    }

    // Fetch current transaction
    const currentTx = await prisma.cashTransaction.findUnique({ where: { id } })
    if (!currentTx) {
        throw new Error("Transaction introuvable")
    }

    const targetType = data.type || currentTx.type
    // Use absolutes to ensure consistent logic regardless of how it was stored
    const magnitude = data.amount !== undefined ? Math.abs(data.amount) : Math.abs(currentTx.amount)

    const finalAmount = targetType === 'OUT' ? -magnitude : magnitude

    const transaction = await prisma.cashTransaction.update({
        where: { id },
        data: {
            date: data.date,
            amount: finalAmount,
            type: data.type,
            description: data.description?.trim(),
            categoryId: data.categoryId
        }
    })
    revalidatePath('/caisse')
    return transaction
}

export async function deleteCashTransaction(id: string) {
    await requireAuth()

    if (!id || typeof id !== "string") {
        return { success: false, message: "ID invalide" }
    }

    try {
        await prisma.cashTransaction.delete({
            where: { id }
        })
        revalidatePath('/caisse')
        return { success: true, message: "Transaction supprimée." }
    } catch (error: any) {
        if (error.code === 'P2025') {
            console.warn(`Attempted to delete non-existent transaction with ID: ${id}`)
            return { success: false, message: "La transaction n'existe plus." }
        }
        console.error("Error deleting cash transaction:", error)
        return { success: false, message: "Erreur lors de la suppression de la transaction." }
    }
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
    await requireAuth()

    // Validation email si fourni
    if (data.accountantEmail) {
        const emailSchema = z.string().email()
        if (!emailSchema.safeParse(data.accountantEmail).success) {
            throw new Error("Email invalide")
        }
    }

    const settings = await prisma.appSettings.update({
        where: { id: 'global' },
        data: {
            accountantEmail: data.accountantEmail?.trim().toLowerCase()
        }
    })
    revalidatePath('/caisse')
    return settings
}

export async function sendExportEmail(to: string, subject: string, fileName: string, base64Content: string) {
    await requireAuth()

    // Validation email
    const emailSchema = z.string().email()
    if (!emailSchema.safeParse(to).success) {
        return { success: false, error: "Email invalide" }
    }

    // Validation du nom de fichier
    if (!fileName || fileName.length > 255) {
        return { success: false, error: "Nom de fichier invalide" }
    }

    // Validation du contenu
    if (!base64Content || base64Content.length > 10 * 1024 * 1024) { // Max 10MB
        return { success: false, error: "Fichier trop volumineux" }
    }

    try {
        const resend = getResendClient()
        const { data, error } = await resend.emails.send({
            from: 'Caisse Restaurant <onboarding@resend.dev>',
            to: [to],
            subject: subject.substring(0, 255), // Limiter la longueur du sujet
            text: `Veuillez trouver ci-joint l'export de la caisse : ${fileName}`,
            attachments: [
                {
                    filename: fileName,
                    content: base64Content,
                },
            ],
        })

        if (error) {
            console.error("Resend error:", error)
            return { success: false, error: error.message }
        }

        return { success: true, id: data?.id }
    } catch (err) {
        console.error("Email send failed:", err)
        return { success: false, error: "Erreur lors de l'envoi" }
    }
}

export async function getCashCategories() {
    await requireAuth()

    return await prisma.cashCategory.findMany({
        orderBy: { name: 'asc' }
    })
}

export async function createCashCategory(name: string, type: CashTransactionType, color?: string) {
    await requireAuth()

    const result = createCashCategorySchema.safeParse({ name, type, color })
    if (!result.success) {
        throw new Error(result.error.errors[0].message)
    }

    const category = await prisma.cashCategory.upsert({
        where: { name_type: { name: result.data.name.trim(), type } },
        update: { color: result.data.color },
        create: { name: result.data.name.trim(), type, color: result.data.color }
    })
    revalidatePath('/caisse')
    return category
}

export async function deleteCashCategory(id: string) {
    await requireAuth()

    if (!id || typeof id !== "string") {
        throw new Error("ID invalide")
    }

    await prisma.cashCategory.delete({
        where: { id }
    })
    revalidatePath('/caisse')
}

export async function clearCaisseData() {
    await requireAuth()

    await prisma.cashTransaction.deleteMany({})
    revalidatePath('/caisse')
    return { success: true }
}

export async function importPopinaExcel(formData: FormData) {
    'use server'
    return { success: false, error: "Fonction obsolète, utiliser la page Fusion" }
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
                    category = val
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
                        category = val
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
