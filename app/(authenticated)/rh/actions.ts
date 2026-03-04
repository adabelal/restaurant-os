'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { hashPassword, generateTempPassword } from "@/lib/password"
import { createUserSchema, createShiftSchema, createDocumentSchema } from "@/lib/validations"
import { z } from "zod"
import { safeAction } from "@/lib/safe-action"

export async function createEmployee(formData: FormData) {
    return safeAction(formData, async (input) => {

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
            return { success: true, message: "Employé créé avec succès." }
        } catch (error: any) {
            console.error("Error creating employee:", error)
            if (error.code === 'P2002') {
                return { success: false, message: "Cet email est déjà utilisé." }
            }
            return { success: false, message: "Une erreur est survenue." }
        }
    })
}

export async function deleteEmployee(formData: FormData) {
    return safeAction(formData, async (input) => {
        const id = input.get("id") as string
        if (!id || typeof id !== "string") {
            return { error: "ID invalide" }
        }

        try {
            await prisma.user.delete({
                where: { id }
            })
            revalidatePath("/rh")
            return { success: true }
        } catch (e) {
            console.error("Failed to delete user", e)
            return { error: "Erreur lors de la suppression" }
        }
    })
}

export async function updateEmployee(formData: FormData) {
    return safeAction(formData, async (input) => {
        const id = input.get("id") as string
        const name = input.get("name") as string
        const email = input.get("email") as string
        const phone = input.get("phone") as string
        const address = input.get("address") as string
        const role = input.get("role") as "ADMIN" | "MANAGER" | "STAFF"
        const hourlyRateStr = input.get("hourlyRate")
        const hourlyRate = hourlyRateStr ? parseFloat(hourlyRateStr as string) : 11.65
        const contractType = input.get("contractType") as string
        const contractDuration = input.get("contractDuration") as string

        if (!id || !name || !email) {
            return { error: "Données manquantes." }
        }

        const emailSchema = z.string().email()
        if (!emailSchema.safeParse(email).success) {
            return { error: "Email invalide." }
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

            revalidatePath("/rh")
            revalidatePath(`/rh/${id}`)
            return { success: true, message: "Profil mis à jour." }
        } catch (error: any) {
            if (error.code === 'P2002') {
                return { error: "Cet email est déjà utilisé." }
            }
            return { error: "Erreur lors de la mise à jour." }
        }
    })
}

export async function toggleEmployeeStatus(id: string, isActive: boolean) {
    return safeAction({ id, isActive }, async (input) => {
        if (!input.id || typeof input.id !== "string") {
            return { error: "ID invalide" }
        }

        try {
            await prisma.user.update({
                where: { id: input.id },
                data: { isActive: input.isActive }
            })
            revalidatePath("/rh")
            return { success: true }
        } catch (e) {
            return { error: "Erreur lors de la mise à jour" }
        }
    })
}

export async function addEmployeeDocument(formData: FormData) {
    return safeAction(formData, async (input) => {
        const rawData = {
            userId: input.get("userId"),
            name: input.get("name"),
            url: input.get("url"),
            type: input.get("type") || "OTHER",
            category: input.get("category") || "OTHER",
            month: input.get("month") ? parseInt(input.get("month") as string) : null,
            year: input.get("year") ? parseInt(input.get("year") as string) : null,
        }

        const result = createDocumentSchema.safeParse(rawData)
        if (!result.success) {
            return { error: result.error.errors[0].message }
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
            return { error: "Erreur sauvegarde doc" }
        }
    })
}

export async function addShift(formData: FormData) {
    return safeAction(formData, async (input) => {
        const rawData = {
            userId: input.get("userId"),
            date: input.get("date"),
            startTime: input.get("startTime"),
            endTime: input.get("endTime"),
            breakMinutes: input.get("breakMinutes") || 0,
        }

        const result = createShiftSchema.safeParse(rawData)
        if (!result.success) {
            return { error: result.error.errors[0].message }
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
                return { error: "Utilisateur non trouvé" }
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
            return { error: "Erreur lors de l'ajout." }
        }
    })
}

export async function deleteShift(shiftId: string, userId: string) {
    return safeAction({ shiftId, userId }, async (input) => {
        if (!input.shiftId || !input.userId) {
            return { error: "Paramètres manquants" }
        }

        try {
            await prisma.shift.delete({
                where: { id: input.shiftId }
            })
            revalidatePath(`/rh/${input.userId}`)
            return { success: true }
        } catch (e) {
            return { error: "Erreur lors de la suppression" }
        }
    })
}

export async function seedEmployees() {
    return safeAction(null, async () => {
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
            return { error: "Erreur lors de l'initialisation" }
        }
    })
}

export async function deleteEmployeeDocument(docId: string, userId: string) {
    return safeAction({ docId, userId }, async (input) => {
        if (!input.docId || !input.userId) {
            return { error: "Paramètres manquants" }
        }

        try {
            await prisma.employeeDocument.delete({
                where: { id: input.docId }
            })
            revalidatePath(`/rh/${input.userId}`)
            return { success: true }
        } catch (e) {
            return { error: "Erreur lors de la suppression" }
        }
    })
}

export async function updateShift(formData: FormData) {
    return safeAction(formData, async (input) => {
        const shiftId = input.get("shiftId") as string
        const userId = input.get("userId") as string
        const date = input.get("date") as string
        const startTimeStr = input.get("startTime") as string
        const endTimeStr = input.get("endTime") as string
        const breakMinutes = parseInt(input.get("breakMinutes") as string) || 0

        if (!shiftId || !userId || !date || !startTimeStr || !endTimeStr) {
            return { error: "Champs requis." }
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
            return { error: "Erreur lors de la modification." }
        }
    })
}

export async function updateHourlyRateHistory(formData: FormData) {
    return safeAction(formData, async (input) => {
        const userId = input.get("userId") as string
        const ratesJson = input.get("ratesJson") as string

        if (!userId || !ratesJson) return { error: "Paramètres manquants" }

        try {
            // Simulation de stockage en attendant migration : on utilise le champ address pour stocker le JSON
            // ATTENTION: C'est une solution de repli temporaire puisque la migration prisma échoue.
            await prisma.user.update({
                where: { id: userId },
                data: {
                    address: ratesJson // On détourne address pour stocker l'historique JSON
                }
            })
            revalidatePath(`/rh/${userId}`)
            return { success: true, message: "Historique mis à jour" }
        } catch (e) {
            return { error: "Erreur lors de la mise à jour" }
        }
    })
}
