'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { hashPassword, generateTempPassword } from "@/lib/password"
import { createUserSchema, createShiftSchema, createDocumentSchema } from "@/lib/validations"
import { z } from "zod"
import { safeAction } from "@/lib/safe-action"
import fs from "fs"
import path from "path"
import { startOfMonth, endOfMonth } from "date-fns"
import { getOrCreateRhFolder, uploadFileToDrive, listFilesRecursive, findOrCreateFolder as findOrCreateDriveFolder } from "@/lib/google-drive"

export async function createEmployee(formData: FormData) {
    return safeAction(formData, async (input) => {

        const rawData = {
            firstName: formData.get("firstName"),
            lastName: formData.get("lastName"),
            email: formData.get("email"),
            role: formData.get("role") || "STAFF",
            hourlyRate: formData.get("hourlyRate") || 11.65,
            netRemuneration: formData.get("netRemuneration") ? parseFloat(formData.get("netRemuneration") as string) : null,
            contractType: formData.get("contractType") || "CDI",
            contractDuration: formData.get("contractDuration") || "FULL_TIME",
        }

        if (rawData.role === 'ADMIN') {
            rawData.contractType = 'GÉRANT'
            rawData.contractDuration = 'FULL_TIME'
            rawData.hourlyRate = 0
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

            // Format name as LASTNAME Firstname
            const fullName = `${data.lastName.toUpperCase()} ${data.firstName}`

            await prisma.user.create({
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    name: fullName,
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
        const id = formData.get("id") as string
        const firstName = formData.get("firstName") as string
        const lastName = formData.get("lastName") as string
        const email = formData.get("email") as string
        const phone = formData.get("phone") as string
        const address = formData.get("address") as string
        const role = formData.get("role") as "ADMIN" | "MANAGER" | "STAFF"
        const hourlyRateStr = formData.get("hourlyRate")
        const hourlyRate = hourlyRateStr ? parseFloat(hourlyRateStr as string) : 11.65
        const contractType = formData.get("contractType") as string
        const contractDuration = formData.get("contractDuration") as string

        const finalRole = role
        let finalContractType = contractType
        let finalContractDuration = contractDuration
        let finalHourlyRate = hourlyRate

        if (finalRole === 'ADMIN') {
            finalContractType = 'GÉRANT'
            finalContractDuration = 'FULL_TIME'
            finalHourlyRate = 0
        }

        if (!id || !firstName || !lastName || !email) {
            return { error: "Données manquantes." }
        }

        const emailSchema = z.string().email()
        if (!emailSchema.safeParse(email).success) {
            return { error: "Email invalide." }
        }

        try {
            const fullName = `${lastName.trim().toUpperCase()} ${firstName.trim()}`
            const updateData: any = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                name: fullName,
                email: email.trim().toLowerCase(),
                phone: phone?.trim() || null,
                role: finalRole,
                hourlyRate: finalHourlyRate,
                contractType: finalContractType,
                contractDuration: finalContractDuration
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

export async function markDpaeAsTese(userId: string) {
    return safeAction({ userId }, async (input) => {
        try {
            await prisma.employeeDocument.create({
                data: {
                    userId: input.userId,
                    name: "[TESE] Déclaration URSSAF (Géré par TESE)",
                    url: "https://www.letese.urssaf.fr",
                    type: "DPAE",
                    category: "TESE",
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear()
                }
            })
            revalidatePath(`/rh/${input.userId}`)
            return { success: true, message: "Validé via TESE" }
        } catch (e) {
            console.error(e)
            return { error: "Erreur sauvegarde TESE" }
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

export async function updateEmployeeNet(employeeId: string, netRemuneration: number | null, month: number, year: number) {
    try {
        await (prisma as any).monthlySalary.upsert({
            where: {
                userId_month_year: {
                    userId: employeeId,
                    month,
                    year
                }
            },
            update: {
                netRemuneration
            },
            create: {
                userId: employeeId,
                month,
                year,
                netRemuneration
            }
        })
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false, message: "Erreur lors de la mise à jour" }
    }
}

export async function getManagerRemunerationFromBank(employeeId: string, month: number, year: number) {
    try {
        const employee = await prisma.user.findUnique({
            where: { id: employeeId },
            select: { name: true, role: true }
        })

        if (!employee || employee.role !== 'ADMIN') return 0

        const startDate = startOfMonth(new Date(year, month - 1, 1))
        const endDate = endOfMonth(new Date(year, month - 1, 1))

        const firstName = (employee as any).firstName || ""
        const lastName = (employee as any).lastName || ""

        // Smart search terms based on user examples
        // For Benjamin: match "Benjamin" or the truncated "BENJAM" found in bank sync
        const searchTerms = [
            firstName,
            firstName.substring(0, 6).toUpperCase(), // e.g. "BENJAM"
            `${lastName} ${firstName}`,
            `${firstName} ${lastName}`
        ].filter(t => t.length >= 3)

        const transactions = await prisma.bankTransaction.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                },
                amount: { lt: 0 },
                OR: [
                    ...searchTerms.map(term => ({
                        description: { contains: term, mode: 'insensitive' as const }
                    })),
                    ...searchTerms.map(term => ({
                        thirdPartyName: { contains: term, mode: 'insensitive' as const }
                    }))
                ]
            }
        })

        // Final filter to avoid false positives (like common last names among family members)
        // If we have "Belal Benjamin", we verify that individual "Benjamin" or "BENJAM" is specifically present
        // and not just the common "Belal"
        const filteredTx = transactions.filter(tx => {
            const desc = (tx.description + (tx.thirdPartyName || '')).toUpperCase()
            const fn = firstName.toUpperCase()
            const fnTrunc = fn.substring(0, 6)

            // Check if the specific manager's identification is present
            return desc.includes(fn) || desc.includes(fnTrunc)
        })

        return filteredTx.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
    } catch (e) {
        console.error("Error fetching manager remuneration:", e)
        return 0
    }
}

export async function getEmployeeSalaryReconciliation(userId: string, month: number, year: number) {
    try {
        const salary = await (prisma as any).monthlySalary.findUnique({
            where: { userId_month_year: { userId, month, year } }
        })

        // Find bank transactions
        const employee = await prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true, name: true } as any
        })

        if (!employee) return null

        const startDate = startOfMonth(new Date(year, month - 1, 1))
        const endDate = endOfMonth(new Date(year, month - 1, 1))

        const firstName = (employee as any).firstName || ""
        const lastName = (employee as any).lastName || ""

        // Search terms: Full name, lastName + 1st letter, etc.
        const searchTerms = [
            `${lastName} ${firstName}`,
            `${firstName} ${lastName}`,
            lastName,
            firstName
        ].filter(t => t && t.length >= 3)

        const bankTxs = await prisma.bankTransaction.findMany({
            where: {
                date: { gte: startDate, lte: endDate },
                amount: { lt: 0 },
                OR: [
                    ...searchTerms.map(t => ({ description: { contains: t, mode: 'insensitive' as const } })),
                    ...searchTerms.map(t => ({ thirdPartyName: { contains: t, mode: 'insensitive' as const } }))
                ]
            },
            orderBy: { date: 'desc' }
        })

        // Refine filtering to avoid generic last names if possible, but usually for employees it's fine
        const filteredTxs = bankTxs.filter(tx => {
            const content = (tx.description + (tx.thirdPartyName || '')).toUpperCase()
            // It must contain the first name OR a very strong match for the full name
            return content.includes(firstName.toUpperCase()) || (content.includes(lastName.toUpperCase()) && lastName.length > 4)
        })

        const totalPaid = filteredTxs.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)

        // If the bankPaid in DB is different from what we found, we might want to update it or just show the drift
        return {
            expected: salary?.netRemuneration ? Number(salary.netRemuneration) : 0,
            actual: totalPaid,
            transactions: filteredTxs.map(tx => ({
                id: tx.id,
                date: tx.date,
                amount: Math.abs(Number(tx.amount)),
                description: tx.description
            })),
            status: salary?.status || 'PENDING'
        }
    } catch (e) {
        console.error(e)
        return null
    }
}

// ─── SYNC & EMAIL ACTIONS ───────────────────────────────────────────────────

const DRIVE_PAIE_ROOT = "/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/RESSOURCES_HUMAINES"

/**
 * Scanne récursivement le dossier local Google Drive pour trouver les fiches de paie d'un salarié
 */
export async function syncEmployeePayslips(userId: string) {
    return safeAction({ userId }, async (input) => {
        try {
            const employee = await prisma.user.findUnique({
                where: { id: input.userId },
                include: { documents: { where: { type: 'PAYSLIP' } } }
            })

            if (!employee) return { error: "Salarié non trouvé" }

            const existingFiles = new Set(employee.documents.map(d => d.name))
            let syncCount = 0

            // 1. Essai de scan local (Mac Adam)
            if (fs.existsSync(DRIVE_PAIE_ROOT)) {
                console.log("RH Sync: Using local DRIVE_PAIE_ROOT path.")
                const foundFiles: { path: string, name: string }[] = []

                const walkLocal = (dir: string) => {
                    const list = fs.readdirSync(dir)
                    for (const file of list) {
                        const fullPath = path.join(dir, file)
                        const stat = fs.statSync(fullPath)
                        if (stat && stat.isDirectory()) walkLocal(fullPath)
                        else if (file.toLowerCase().endsWith('.pdf')) {
                            const cleanName = employee.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                            const cleanFile = file.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                            const nameParts = cleanName.split(/\s+/)
                            if (nameParts.every(part => cleanFile.includes(part)) && !existingFiles.has(file)) {
                                foundFiles.push({ path: fullPath, name: file })
                            }
                        }
                    }
                }
                walkLocal(DRIVE_PAIE_ROOT)

                for (const f of foundFiles) {
                    const fileBuffer = fs.readFileSync(f.path)
                    const folderId = await getOrCreateRhFolder(employee.name, 'PAYSLIP')
                    const dateMatch = f.name.match(/(\d{4})[_-](\d{2})/)
                    const year = dateMatch ? parseInt(dateMatch[1]) : new Date().getFullYear()
                    const month = dateMatch ? parseInt(dateMatch[2]) : new Date().getMonth() + 1
                    const driveFile = await uploadFileToDrive(fileBuffer, f.name, 'application/pdf', folderId)

                    await prisma.employeeDocument.create({
                        data: {
                            userId: employee.id,
                            name: f.name,
                            url: driveFile.webViewLink,
                            type: 'PAYSLIP',
                            category: 'PAIE',
                            month,
                            year
                        }
                    })

                    // Extract potential net amount from filename (e.g. _1540.23.pdf)
                    const netMatch = f.name.match(/(\d{3,5})[.,](\d{2})/)
                    if (netMatch) {
                        const netAmount = parseFloat(`${netMatch[1]}.${netMatch[2]}`)
                        await (prisma as any).monthlySalary.upsert({
                            where: { userId_month_year: { userId: employee.id, month, year } },
                            update: { netRemuneration: netAmount },
                            create: { userId: employee.id, month, year, netRemuneration: netAmount }
                        })
                    }

                    syncCount++
                }
            }
            // 2. Scan CLOUD (Serveur) si local absent ou si besoin
            else {
                console.log("RH Sync: Local path missing, starting Cloud-side scan.")
                const rhFolderId = await (findOrCreateDriveFolder as any)('RESSOURCES_HUMAINES')
                const allCloudPdf = await listFilesRecursive(rhFolderId)

                for (const f of allCloudPdf) {
                    if (!f.name.toLowerCase().endsWith('.pdf')) continue
                    if (existingFiles.has(f.name)) continue

                    const cleanName = employee.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    const cleanFile = f.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    const nameParts = cleanName.split(/\s+/)

                    if (nameParts.every(part => cleanFile.includes(part))) {
                        const dateMatch = f.name.match(/(\d{4})[_-](\d{2})/)
                        const year = dateMatch ? parseInt(dateMatch[1]) : new Date().getFullYear()
                        const month = dateMatch ? parseInt(dateMatch[2]) : new Date().getMonth() + 1

                        await prisma.employeeDocument.create({
                            data: {
                                userId: employee.id,
                                name: f.name,
                                url: f.webViewLink,
                                type: 'PAYSLIP',
                                category: 'PAIE',
                                month,
                                year
                            }
                        })

                        // Same net extraction logic for cloud files
                        const netMatch = f.name.match(/(\d{3,5})[.,](\d{2})/)
                        if (netMatch) {
                            const netAmount = parseFloat(`${netMatch[1]}.${netMatch[2]}`)
                            await (prisma as any).monthlySalary.upsert({
                                where: { userId_month_year: { userId: employee.id, month, year } },
                                update: { netRemuneration: netAmount },
                                create: { userId: employee.id, month, year, netRemuneration: netAmount }
                            })
                        }
                        syncCount++
                    }
                }
            }

            revalidatePath(`/rh/${employee.id}`)
            return { success: true, message: `${syncCount} nouvelle(s) fiche(s) synchronisée(s).` }
        } catch (e: any) {
            console.error("Sync Error:", e)
            return { error: "Erreur lors de la synchronisation : " + e.message }
        }
    })
}

/**
 * Envoie un ou plusieurs documents par email au salarié
 */
export async function sendDocumentsEmail(docIds: string[], customBody?: string) {
    return safeAction({ docIds, customBody }, async (input) => {
        try {
            const docs = await prisma.employeeDocument.findMany({
                where: { id: { in: input.docIds } },
                include: { user: true }
            })

            if (docs.length === 0) return { error: "Aucun document trouvé" }
            const user = docs[0].user
            if (!user.email) return { error: "Le salarié n'a pas d'adresse email enregistrée" }

            const resendApiKey = process.env.RESEND_API_KEY
            if (!resendApiKey) return { error: "Configuration email (Resend) manquante" }

            // Construction de la liste des liens
            const linksHtml = docs.map(d => `
                <div style="margin-bottom: 12px; padding: 10px; border-left: 4px solid #10b981; bg: #f0fdf4;">
                    <a href="${d.url}" style="color: #10b981; font-weight: bold; text-decoration: none; font-size: 14px;">
                        ${d.name} ${d.month && d.year ? `(${new Date(2000, d.month - 1).toLocaleDateString('fr-FR', { month: 'long' })} ${d.year})` : ''}
                    </a>
                </div>
            `).join('')

            const defaultBody = `Une nouvelle fiche de paie ou un document RH a été ajouté à votre dossier.\n\nVous pouvez le consulter ou le télécharger via les liens ci-dessous :`
            const body = input.customBody || defaultBody

            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${resendApiKey}`,
                },
                body: JSON.stringify({
                    from: "Restaurant OS <rh@siwa-bleury.fr>",
                    to: [user.email],
                    subject: docs.length === 1 ? `Votre document : ${docs[0].name}` : `Vos documents RH (${docs.length} fichiers)`,
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
                            <div style="background-color: #10b981; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                                <h1 style="color: white; margin: 0; font-size: 20px;">Restaurant OS - Documents RH</h1>
                            </div>
                            <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                                <p style="font-size: 16px; font-weight: bold; margin-bottom: 20px;">Bonjour ${user.name},</p>
                                <p style="white-space: pre-wrap; margin-bottom: 25px;">${body}</p>
                                <div style="margin: 30px 0;">
                                    ${linksHtml}
                                </div>
                                <p style="font-size: 13px; color: #6b7280; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                                    Ceci est un envoi automatique. Veuillez ne pas répondre à cet email.
                                </p>
                            </div>
                        </div>
                    `,
                }),
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.message || "Erreur Resend")
            }

            return { success: true, message: docs.length === 1 ? "Email envoyé avec succès." : `${docs.length} documents envoyés avec succès.` }
        } catch (e: any) {
            console.error("Email Error:", e)
            return { error: "L'envoi a échoué : " + e.message }
        }
    })
}
