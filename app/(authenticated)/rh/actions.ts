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
            const updateData: any = {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone?.trim() || null,
                role,
                hourlyRate,
                contractType,
                contractDuration
            }

            // Important: On n'écrase address que si la valeur est présente dans le formulaire
            // pour éviter d'écraser l'historique des taux stocké dans ce champ.
            if (formData.has("address")) {
                updateData.address = address?.trim() || null
            }

            await prisma.user.update({
                where: { id },
                data: updateData
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
            position: input.get("position") || null,
        }

        const result = createShiftSchema.safeParse(rawData)
        if (!result.success) {
            return { error: result.error.errors[0].message }
        }

        const data = result.data

        const isoStart = input.get("isoStart") as string
        const isoEnd = input.get("isoEnd") as string

        try {
            const start = isoStart ? new Date(isoStart) : new Date(`${data.date}T${data.startTime}:00`)
            const end = isoEnd ? new Date(isoEnd) : new Date(`${data.date}T${data.endTime}:00`)

            if (end <= start && !isoEnd) {
                end.setDate(end.getDate() + 1)
            }

            const user = await prisma.user.findUnique({ where: { id: data.userId } })
            if (!user) {
                return { error: "Utilisateur non trouvé" }
            }

            let actualBreakMinutes = data.breakMinutes;
            const isManager = user.name.toLowerCase().includes('adam') || user.name.toLowerCase().includes('benjamin')

            if (!isManager) {
                const diffMs = end.getTime() - start.getTime()
                const diffHours = diffMs / (1000 * 60 * 60)
                if (diffHours > 6 && actualBreakMinutes < 20) {
                    const missingBreak = 20 - actualBreakMinutes
                    actualBreakMinutes = 20
                    end.setMinutes(end.getMinutes() + missingBreak)
                }
            }

            await prisma.shift.create({
                data: {
                    userId: data.userId,
                    startTime: start,
                    endTime: end,
                    breakMinutes: actualBreakMinutes,
                    hourlyRate: user.hourlyRate,
                    isSunday: start.getDay() === 0,
                    status: "COMPLETED",
                    position: data.position
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
        const position = (input.get("position") as string) || null

        const isoStart = input.get("isoStart") as string
        const isoEnd = input.get("isoEnd") as string

        if (!shiftId || !userId || !date || !startTimeStr || !endTimeStr) {
            return { error: "Champs requis." }
        }

        try {
            const start = isoStart ? new Date(isoStart) : new Date(`${date}T${startTimeStr}:00`)
            const end = isoEnd ? new Date(isoEnd) : new Date(`${date}T${endTimeStr}:00`)

            if (end <= start && !isoEnd) {
                end.setDate(end.getDate() + 1)
            }

            const user = await prisma.user.findUnique({ where: { id: userId } })
            if (!user) return { error: "Utilisateur non trouvé" }

            let actualBreakMinutes = breakMinutes;
            const isManager = user.name.toLowerCase().includes('adam') || user.name.toLowerCase().includes('benjamin')

            if (!isManager) {
                const diffMs = end.getTime() - start.getTime()
                const diffHours = diffMs / (1000 * 60 * 60)
                if (diffHours > 6 && actualBreakMinutes < 20) {
                    const missingBreak = 20 - actualBreakMinutes
                    actualBreakMinutes = 20
                    end.setMinutes(end.getMinutes() + missingBreak)
                }
            }

            await prisma.shift.update({
                where: { id: shiftId },
                data: {
                    startTime: start,
                    endTime: end,
                    breakMinutes: actualBreakMinutes,
                    position,
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
            await prisma.user.update({
                where: { id: userId },
                data: {
                    address: ratesJson
                }
            })
            revalidatePath(`/rh/${userId}`)
            return { success: true, message: "Historique mis à jour" }
        } catch (e) {
            return { error: "Erreur lors de la mise à jour" }
        }
    })
}

export async function moveShift(shiftId: string, newDateStr: string) {
    return safeAction({ shiftId, newDateStr }, async (input) => {
        if (!input.shiftId || !input.newDateStr) {
            return { error: "Paramètres manquants" }
        }

        try {
            const shift = await prisma.shift.findUnique({
                where: { id: input.shiftId }
            })

            if (!shift || !shift.startTime || !shift.endTime) return { error: "Shift non trouvé ou données invalides" }

            const newDay = new Date(input.newDateStr)

            // Calcul du décalage
            const originalStart = new Date(shift.startTime)
            const originalEnd = new Date(shift.endTime)
            const durationMs = originalEnd.getTime() - originalStart.getTime()

            // Nouvelle date de début (conserve l'heure originale)
            const newStart = new Date(newDay)
            newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0)

            // Nouvelle date de fin (conserve la durée originale)
            const newEnd = new Date(newStart.getTime() + durationMs)

            await prisma.shift.update({
                where: { id: input.shiftId },
                data: {
                    startTime: newStart,
                    endTime: newEnd,
                    isSunday: newStart.getDay() === 0
                }
            })

            revalidatePath("/rh")
            return { success: true }
        } catch (e) {
            console.error(e)
            return { error: "Erreur lors du déplacement du shift" }
        }
    })
}

export async function updateShiftPosition(shiftId: string, position: string) {
    return safeAction({ shiftId, position }, async (input) => {
        if (!input.shiftId || !input.position) {
            return { error: "Paramètres manquants" }
        }

        try {
            // Utilisation d'un cast 'any' pour contourner le délai de génération Prisma si nécessaire
            await (prisma.shift as any).update({
                where: { id: input.shiftId },
                data: { position: input.position.toUpperCase() }
            })

            revalidatePath("/rh")
            return { success: true }
        } catch (e) {
            console.error(e)
            return { error: "Erreur lors de la mise à jour du poste" }
        }
    })
}

export async function addManagerShift(userId: string, date: string, position: string) {
    return safeAction({ userId, date, position }, async (input) => {
        if (!input.userId || !input.date || !input.position) {
            return { error: "Paramètres manquants" }
        }

        try {
            const startTime = new Date(input.date)
            startTime.setHours(18, 0, 0, 0) // Par défaut 18h
            const endTime = new Date(input.date)
            endTime.setHours(23, 30, 0, 0) // Par défaut 23h30

            // Vérifier si un shift existe déjà pour cet utilisateur et ce jour
            const existing = await prisma.shift.findFirst({
                where: {
                    userId: input.userId,
                    startTime: {
                        gte: new Date(new Date(input.date).setHours(0, 0, 0, 0)),
                        lt: new Date(new Date(input.date).setHours(23, 59, 59, 999))
                    }
                }
            })

            if (existing) return { success: true, message: "Déjà présent" }

            await (prisma.shift as any).create({
                data: {
                    userId: input.userId,
                    startTime,
                    endTime,
                    position: input.position.toUpperCase(),
                    hourlyRate: 0,
                    status: "COMPLETED"
                }
            })

            revalidatePath("/rh")
            return { success: true }
        } catch (e) {
            console.error(e)
            return { error: "Erreur lors de la création du shift gérant" }
        }
    })
}

export async function autoFillManagerShifts() {
    return safeAction(null, async () => {
        try {
            // 1. Trouver Adam et Benjamin
            const managers = await prisma.user.findMany({
                where: {
                    role: "ADMIN",
                    OR: [
                        { name: { contains: "Adam", mode: "insensitive" } },
                        { name: { contains: "Benjamin", mode: "insensitive" } }
                    ]
                }
            })

            if (managers.length === 0) return { error: "Aucun gérant trouvé." }

            const today = new Date()
            today.setHours(23, 59, 59, 999)

            // On remonte sur les 30 derniers jours par exemple (ou depuis le début de l'année si besoin)
            // L'utilisateur ne veut pas de préremplissage long terme, donc on s'arrête à aujourd'hui.
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - 30) // 30 jours glissants

            let createdCount = 0

            for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
                const dayOfWeek = d.getDay() // 0=Dim, 4=Jeu, 5=Ven, 6=Sam

                if ([4, 5, 6].includes(dayOfWeek)) {
                    const dateStr = d.toISOString().split('T')[0]

                    for (const manager of managers) {
                        // On utilise addManagerShift indirectement ou on recode la logique pour éviter les appels multiples de safeAction
                        const dateStart = new Date(d)
                        dateStart.setHours(18, 0, 0, 0)
                        const dateEnd = new Date(d)
                        dateEnd.setHours(23, 30, 0, 0)

                        const existing = await prisma.shift.findFirst({
                            where: {
                                userId: manager.id,
                                startTime: {
                                    gte: new Date(new Date(d).setHours(0, 0, 0, 0)),
                                    lt: new Date(new Date(d).setHours(23, 59, 59, 999))
                                }
                            }
                        })

                        if (!existing) {
                            await (prisma.shift as any).create({
                                data: {
                                    userId: manager.id,
                                    startTime: dateStart,
                                    endTime: dateEnd,
                                    position: "SALLE",
                                    hourlyRate: 0,
                                    status: "COMPLETED"
                                }
                            })
                            createdCount++
                        }
                    }
                }
            }

            revalidatePath("/rh")
            return { success: true, createdCount }
        } catch (e) {
            console.error(e)
            return { error: "Erreur lors de l'auto-remplissage." }
        }
    })
}
