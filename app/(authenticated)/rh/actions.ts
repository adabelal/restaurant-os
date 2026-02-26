'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth-utils"
import { hashPassword, generateTempPassword } from "@/lib/password"
import { createUserSchema, createShiftSchema, createDocumentSchema } from "@/lib/validations"
import { z } from "zod"

export async function createEmployee(formData: FormData) {
    // Vérification authentification
    await requireAuth()

    const rawData = {
        name: formData.get("name"),
        email: formData.get("email"),
        role: formData.get("role") || "STAFF",
        hourlyRate: formData.get("hourlyRate") || 11.65,
        contractType: formData.get("contractType") || "CDI",
        contractDuration: formData.get("contractDuration") || "FULL_TIME",
    }

    // Validation avec Zod
    const result = createUserSchema.safeParse(rawData)
    if (!result.success) {
        return { success: false, message: result.error.errors[0].message }
    }

    const data = result.data

    try {
        // Générer un mot de passe temporaire sécurisé
        const tempPassword = generateTempPassword()
        const hashedPassword = await hashPassword(tempPassword)

        await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
                hourlyRate: data.hourlyRate ?? 11.65,
                contractType: data.contractType,
                contractDuration: data.contractDuration,
                password: hashedPassword,
            },
        })

        revalidatePath("/rh")
        // Note: En production, envoyer le mot de passe temporaire par email
        return { success: true, message: "Employé créé avec succès." }
    } catch (error: any) {
        console.error("Error creating employee:", error)
        if (error.code === 'P2002') {
            return { success: false, message: "Cet email est déjà utilisé." }
        }
        return { success: false, message: "Une erreur est survenue." }
    }
}

export async function deleteEmployee(formData: FormData) {
    await requireAuth()

    const id = formData.get("id") as string
    if (!id || typeof id !== "string") {
        return { success: false, message: "ID invalide" }
    }

    try {
        await prisma.user.delete({
            where: { id }
        })
        revalidatePath("/rh")
        return { success: true }
    } catch (e) {
        console.error("Failed to delete user", e)
        return { success: false, message: "Erreur lors de la suppression" }
    }
}

export async function updateEmployee(formData: FormData) {
    await requireAuth()

    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string
    const role = formData.get("role") as "ADMIN" | "MANAGER" | "STAFF"
    const hourlyRate = parseFloat(formData.get("hourlyRate") as string)
    const contractType = formData.get("contractType") as string
    const contractDuration = formData.get("contractDuration") as string

    // Validation basique
    if (!id || !name || !email) {
        return { success: false, message: "Données manquantes." }
    }

    // Validation email
    const emailSchema = z.string().email()
    if (!emailSchema.safeParse(email).success) {
        return { success: false, message: "Email invalide." }
    }

    try {
        await prisma.user.update({
            where: { id },
            data: {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone?.trim() || null,
                address: address?.trim() || null,
                role,
                hourlyRate,
                contractType,
                contractDuration
            }
        })
        revalidatePath(`/rh`)
        revalidatePath(`/rh/${id}`)
        return { success: true, message: "Profil mis à jour." }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, message: "Cet email est déjà utilisé." }
        }
        return { success: false, message: "Erreur lors de la mise à jour." }
    }
}

export async function toggleEmployeeStatus(id: string, isActive: boolean) {
    await requireAuth()

    if (!id || typeof id !== "string") {
        return { success: false, message: "ID invalide" }
    }

    try {
        await prisma.user.update({
            where: { id },
            data: { isActive }
        })
        revalidatePath("/rh")
        return { success: true }
    } catch (e) {
        return { success: false, message: "Erreur lors de la mise à jour" }
    }
}

export async function addEmployeeDocument(formData: FormData) {
    await requireAuth()

    const rawData = {
        userId: formData.get("userId"),
        name: formData.get("name"),
        url: formData.get("url"),
        type: formData.get("type") || "OTHER",
        category: formData.get("category") || "OTHER",
        month: formData.get("month") ? parseInt(formData.get("month") as string) : null,
        year: formData.get("year") ? parseInt(formData.get("year") as string) : null,
    }

    const result = createDocumentSchema.safeParse(rawData)
    if (!result.success) {
        return { success: false, message: result.error.errors[0].message }
    }

    const data = result.data

    try {
        await prisma.employeeDocument.create({
            data: {
                userId: data.userId,
                name: data.name,
                url: data.url,
                type: data.type,
                category: data.category,
                month: data.month,
                year: data.year
            }
        })
        revalidatePath(`/rh/${data.userId}`)
        return { success: true, message: "Document ajouté" }
    } catch (e) {
        console.error(e)
        return { success: false, message: "Erreur sauvegarde doc" }
    }
}

// Fonction appelée par webhook N8N (authentifiée via API key dans la route)
export async function autoLinkPayslip(userId: string, filename: string, driveUrl: string) {
    // Validation des entrées
    if (!userId || !filename || !driveUrl) {
        return { success: false, message: "Paramètres manquants" }
    }

    // Validation URL
    const urlSchema = z.string().url()
    if (!urlSchema.safeParse(driveUrl).success) {
        return { success: false, message: "URL invalide" }
    }

    // Format: 2025_12_NOM_BdP.pdf
    const parts = filename.split('_')
    if (parts.length < 3) return { success: false, message: "Format invalide" }

    const year = parseInt(parts[0])
    const month = parseInt(parts[1])

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return { success: false, message: "Date invalide dans le nom du fichier" }
    }

    try {
        await prisma.employeeDocument.create({
            data: {
                userId,
                name: `Fiche de Paie ${month}/${year}`,
                url: driveUrl,
                type: "PAYSLIP",
                category: "PAIE",
                month,
                year
            }
        })
        return { success: true }
    } catch (e) {
        return { success: false, message: "Erreur lors de la création" }
    }
}

export async function addShift(formData: FormData) {
    await requireAuth()

    const rawData = {
        userId: formData.get("userId"),
        date: formData.get("date"),
        startTime: formData.get("startTime"),
        endTime: formData.get("endTime"),
        breakMinutes: formData.get("breakMinutes") || 0,
    }

    const result = createShiftSchema.safeParse(rawData)
    if (!result.success) {
        return { success: false, message: result.error.errors[0].message }
    }

    const data = result.data

    try {
        const start = new Date(`${data.date}T${data.startTime}:00`)
        const end = new Date(`${data.date}T${data.endTime}:00`)

        if (end <= start) {
            end.setDate(end.getDate() + 1)
        }

        const user = await prisma.user.findUnique({ where: { id: data.userId } })
        if (!user) {
            return { success: false, message: "Utilisateur non trouvé" }
        }

        await prisma.shift.create({
            data: {
                userId: data.userId,
                startTime: start,
                endTime: end,
                breakMinutes: data.breakMinutes,
                hourlyRate: user.hourlyRate,
                isSunday: start.getDay() === 0,
                status: "COMPLETED"
            }
        })

        revalidatePath(`/rh/${data.userId}`)
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false, message: "Erreur lors de l'ajout." }
    }
}

export async function deleteShift(shiftId: string, userId: string) {
    await requireAuth()

    if (!shiftId || !userId) {
        return { success: false, message: "Paramètres manquants" }
    }

    try {
        await prisma.shift.delete({
            where: { id: shiftId }
        })
        revalidatePath(`/rh/${userId}`)
        return { success: true }
    } catch (e) {
        return { success: false, message: "Erreur lors de la suppression" }
    }
}

export async function seedEmployees() {
    await requireAuth()

    const list = [
        "Laura Souchet", "Noélie Souchet", "Amelie Cauchois", "Manon Florent",
        "Laetitia Belal", "Virginie Belal", "Jules Coulon", "Florence Leroy",
        "Lysea Gammiery syda", "Xavier Belal", "Prudencia Kons", "Sylvain Souday",
        "Marie Geoffroy", "Sarah Rosse", "Jenifer Guerra", "Julien Akremann", "Micheline Dupont"
    ]

    try {
        for (const name of list) {
            const email = name.toLowerCase().replace(/\s+/g, '.') + "@restaurant.os"

            const existing = await prisma.user.findUnique({ where: { email } })
            if (existing) continue

            const tempPassword = generateTempPassword()
            const hashedPassword = await hashPassword(tempPassword)

            await prisma.user.create({
                data: {
                    name,
                    email,
                    role: "STAFF",
                    hourlyRate: 11.65,
                    password: hashedPassword,
                    isActive: true
                }
            })
        }
        revalidatePath("/rh")
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false }
    }
}

export async function deleteEmployeeDocument(docId: string, userId: string) {
    await requireAuth()

    if (!docId || !userId) {
        return { success: false, message: "Paramètres manquants" }
    }

    try {
        await prisma.employeeDocument.delete({
            where: { id: docId }
        })
        revalidatePath(`/rh/${userId}`)
        return { success: true }
    } catch (e) {
        return { success: false, message: "Erreur lors de la suppression" }
    }
}

export async function updateShift(formData: FormData) {
    await requireAuth()

    const shiftId = formData.get("shiftId") as string
    const userId = formData.get("userId") as string
    const date = formData.get("date") as string
    const startTimeStr = formData.get("startTime") as string
    const endTimeStr = formData.get("endTime") as string
    const breakMinutes = parseInt(formData.get("breakMinutes") as string) || 0

    if (!shiftId || !userId || !date || !startTimeStr || !endTimeStr) {
        return { success: false, message: "Champs requis." }
    }

    try {
        const start = new Date(`${date}T${startTimeStr}:00`)
        const end = new Date(`${date}T${endTimeStr}:00`)

        if (end <= start) {
            end.setDate(end.getDate() + 1)
        }

        await prisma.shift.update({
            where: { id: shiftId },
            data: {
                startTime: start,
                endTime: end,
                breakMinutes,
            }
        })

        revalidatePath(`/rh/${userId}`)
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false, message: "Erreur lors de la modification." }
    }
}
