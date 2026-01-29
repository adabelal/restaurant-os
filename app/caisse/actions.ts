'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { CashTransactionType } from "@prisma/client"
import * as XLSX from "xlsx"

export async function getCashTransactions(filters: {
    startDate?: Date,
    endDate?: Date,
    categoryId?: string,
    type?: CashTransactionType,
    orderBy?: 'date' | 'createdAt'
} = {}) {
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
    const transaction = await prisma.cashTransaction.create({
        data: {
            date: data.date,
            amount: data.amount,
            type: data.type,
            description: data.description,
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
    const transaction = await prisma.cashTransaction.update({
        where: { id },
        data: {
            date: data.date,
            amount: data.amount,
            type: data.type,
            description: data.description,
            categoryId: data.categoryId
        }
    })
    revalidatePath('/caisse')
    return transaction
}

export async function deleteCashTransaction(id: string) {
    try {
        await prisma.cashTransaction.delete({
            where: { id }
        })
        revalidatePath('/caisse')
        return { success: true, message: "Transaction supprimée." }
    } catch (error: any) {
        if (error.code === 'P2025') {
            console.warn(`Attempted to delete non-existent transaction with ID: ${id}`);
            return { success: false, message: "La transaction n'existe plus." };
        }
        console.error("Error deleting cash transaction:", error);
        return { success: false, message: "Erreur lors de la suppression de la transaction." };
    }
}

export async function getAppSettings() {
    return await prisma.appSettings.upsert({
        where: { id: 'global' },
        update: {},
        create: { id: 'global' }
    })
}

export async function updateAppSettings(data: { accountantEmail?: string }) {
    const settings = await prisma.appSettings.update({
        where: { id: 'global' },
        data
    })
    revalidatePath('/caisse')
    return settings
}

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendExportEmail(to: string, subject: string, fileName: string, base64Content: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Caisse Restaurant <ada.belal@gmail.com>', // Using personal email for testing as requested. Please use a verified domain in production.
            to: [to],
            subject: subject,
            text: `Veuillez trouver ci-joint l'export de la caisse : ${fileName}`,
            attachments: [
                {
                    filename: fileName,
                    content: base64Content,
                },
            ],
        });

        if (data) {
            console.log("Resend success data:", data);
        }

        if (error) {
            console.error("Resend error:", error);
            return { success: false, error: error.message };
        }

        return { success: true, id: data?.id };
    } catch (err) {
        console.error("Email send failed:", err);
        return { success: false, error: String(err) };
    }
}

export async function getCashCategories() {
    return await prisma.cashCategory.findMany({
        orderBy: { name: 'asc' }
    })
}

export async function createCashCategory(name: string, type: CashTransactionType, color?: string) {
    const category = await prisma.cashCategory.upsert({
        where: { name_type: { name, type } },
        update: { color },
        create: { name, type, color }
    })
    revalidatePath('/caisse')
    return category
}

export async function deleteCashCategory(id: string) {
    await prisma.cashCategory.delete({
        where: { id }
    })
    revalidatePath('/caisse')
}

export async function clearCaisseData() {
    await prisma.cashTransaction.deleteMany({})
    revalidatePath('/caisse')
    return { success: true }
}

export async function importCaisseFromExcel(formData: FormData) {
    try {
        const file = formData.get('file') as File
        if (!file) throw new Error("Aucun fichier fourni")

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { cellDates: true })

        const catMapStrings: Record<string, string> = {
            "METRO": "Achats",
            "GRAND FRAIS": "Achats",
            "PASCAULT": "Achats",
            "RECETTE": "Recettes",
            "DEPOT": "Banque",
            "MONNAIE": "Monnaie",
            "POURBOIRE": "Social",
            "RETRAIT": "Banque",
            "EDF": "Charges",
            "LOYER": "Charges"
        }

        const transactionsToCreate: any[] = []
        const categoriesIn = new Set<string>()
        const categoriesOut = new Set<string>()

        // Try to find the correct sheet
        const sheetName = workbook.SheetNames.find(n =>
            ["caisse", "entrées", "entrees"].some(k => n.toLowerCase().includes(k))
        ) || workbook.SheetNames[0]

        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)

        for (const r of data) {
            const row = r as any
            const date = row['Date'] || row['DATE']
            const libelle = row['Libellé'] || row['LIBELLE'] || row['Description']

            const sortiesValue = row['SORTIES'] || row['Sorties'] || row['Sortie']
            const entreesValue = row['ENTREES'] || row['Entrées'] || row['Entrée']

            if (!date || (!sortiesValue && !entreesValue)) continue

            let amount = 0
            let type: CashTransactionType = 'IN'

            if (entreesValue && (isNaN(parseFloat(sortiesValue)) || parseFloat(sortiesValue) === 0)) {
                amount = parseFloat(entreesValue)
                type = 'IN'
            } else if (sortiesValue) {
                amount = parseFloat(sortiesValue)
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
                description: String(libelle),
                amount,
                type,
                categoryName: category
            })
        }

        // Add Logic for separate "Sorties" sheet if it exists and wasn't the main one
        const outSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes("sorties"))
        if (outSheetName && outSheetName !== sheetName) {
            const outWorksheet = workbook.Sheets[outSheetName]
            const outData = XLSX.utils.sheet_to_json(outWorksheet)
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
                    description: String(libelle),
                    amount,
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

        // Insertion
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
        return { success: false, error: String(error) }
    }
}

export async function importPopinaExcel(formData: FormData) {
    try {
        const file = formData.get('file') as File
        if (!file) throw new Error("Aucun fichier fourni")

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { cellDates: true })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        // Col I is index 8 (Espèces)
        // Col D is index 3 (Date fin / Journée) - or look for headers
        // Headers are on the first row
        const headers = data[0]
        const dateIdx = headers.findIndex(h => String(h).includes("Fin"))
        const cashIdx = 8 // Hardcoded for col I as requested

        // Create Recettes (Espèces) category if not exists
        const category = await prisma.cashCategory.upsert({
            where: { name_type: { name: "Recettes (Popina)", type: 'IN' } },
            update: {},
            create: { name: "Recettes (Popina)", type: 'IN', color: "#10b981" }
        })

        let count = 0
        // Skip header row
        for (let i = 1; i < data.length; i++) {
            const row = data[i]
            const rawDate = row[dateIdx]
            const cashAmount = parseFloat(row[cashIdx])

            if (!rawDate || isNaN(cashAmount) || cashAmount <= 0) continue

            // Parse date (Handles string or Date object)
            let date = rawDate instanceof Date ? rawDate : new Date(rawDate)

            // Check for potential duplicate (same date and amount for Popina category)
            const existing = await prisma.cashTransaction.findFirst({
                where: {
                    date: date,
                    amount: cashAmount,
                    categoryId: category.id
                }
            })

            if (!existing) {
                await prisma.cashTransaction.create({
                    data: {
                        date,
                        amount: cashAmount,
                        type: 'IN',
                        description: `Recette Espèces Popina (Clôture)`,
                        categoryId: category.id
                    }
                })
                count++
            }
        }

        revalidatePath('/caisse')
        return { success: true, count }
    } catch (error) {
        console.error("Popina import failed:", error)
        return { success: false, error: String(error) }
    }
}
