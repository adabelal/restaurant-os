'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createEmployee(formData: FormData) {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as "ADMIN" | "MANAGER" | "STAFF"
    const hourlyRate = parseFloat(formData.get("hourlyRate") as string) || 11.65
    const contractType = formData.get("contractType") as string || "CDI"
    const contractDuration = formData.get("contractDuration") as string || "FULL_TIME"

    if (!name || !email) {
        return { success: false, message: "Nom et email requis." }
    }

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                role: role || "STAFF",
                hourlyRate: hourlyRate,
                contractType,
                contractDuration,
                password: "temp-password-123", // On gérera l'auth plus tard
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
}

export async function deleteEmployee(formData: FormData) {
    const id = formData.get("id") as string
    if (!id) return;

    try {
        await prisma.user.delete({
            where: { id }
        })
        revalidatePath("/rh")
    } catch (e) {
        console.error("Failed to delete user", e)
    }
}

export async function updateEmployee(formData: FormData) {
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string
    const role = formData.get("role") as "ADMIN" | "MANAGER" | "STAFF"
    const hourlyRate = parseFloat(formData.get("hourlyRate") as string)
    const contractType = formData.get("contractType") as string
    const contractDuration = formData.get("contractDuration") as string

    if (!id || !name || !email) {
        return { success: false, message: "Données manquantes." }
    }

    try {
        await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                address,
                role,
                hourlyRate,
                contractType,
                contractDuration
            }
        })
        revalidatePath(`/rh`)
        revalidatePath(`/rh/${id}`)
        return { success: true, message: "Profil mis à jour." }
    } catch (e) {
        return { success: false, message: "Erreur lors de la mise à jour." }
    }
}

export async function toggleEmployeeStatus(id: string, isActive: boolean) {
    try {
        await prisma.user.update({
            where: { id },
            data: { isActive }
        })
        revalidatePath("/rh")
        return { success: true }
    } catch (e) {
        return { success: false }
    }
}

export async function addEmployeeDocument(formData: FormData) {
    const userId = formData.get("userId") as string
    const name = formData.get("name") as string
    const url = formData.get("url") as string
    const type = formData.get("type") as string
    const category = formData.get("category") as string || "OTHER"
    const month = formData.get("month") ? parseInt(formData.get("month") as string) : null
    const year = formData.get("year") ? parseInt(formData.get("year") as string) : null

    if (!userId || !name || !url) return { success: false, message: "Champs requis" }

    try {
        await prisma.employeeDocument.create({
            data: {
                userId,
                name,
                url,
                type,
                category,
                month,
                year
            }
        })
        revalidatePath(`/rh/${userId}`)
        return { success: true, message: "Document ajouté" }
    } catch (e) {
        console.error(e)
        return { success: false, message: "Erreur sauvegarde doc" }
    }
}

// Spécial N8N : Pour appeler depuis un webhook N8N plus tard
export async function autoLinkPayslip(userId: string, filename: string, driveUrl: string) {
    // Format: 2025_12_NOM_BdP.pdf
    const parts = filename.split('_')
    if (parts.length < 3) return { success: false, message: "Format invalide" }

    const year = parseInt(parts[0])
    const month = parseInt(parts[1])
    const name = parts[2]

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
        return { success: false }
    }
}

export async function addShift(formData: FormData) {
    const userId = formData.get("userId") as string
    const date = formData.get("date") as string
    const startTimeStr = formData.get("startTime") as string
    const endTimeStr = formData.get("endTime") as string
    const breakMinutes = parseInt(formData.get("breakMinutes") as string) || 0

    if (!userId || !date || !startTimeStr || !endTimeStr) {
        return { success: false, message: "Champs requis." }
    }

    try {
        const start = new Date(`${date}T${startTimeStr}:00`)
        const end = new Date(`${date}T${endTimeStr}:00`)

        if (end <= start) {
            end.setDate(end.getDate() + 1)
        }

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) throw new Error("Utilisateur non trouvé")

        await prisma.shift.create({
            data: {
                userId,
                startTime: start,
                endTime: end,
                breakMinutes,
                hourlyRate: user.hourlyRate,
                isSunday: start.getDay() === 0,
                status: "COMPLETED"
            }
        })

        revalidatePath(`/rh/${userId}`)
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false, message: "Erreur lors de l'ajout." }
    }
}

export async function deleteShift(shiftId: string, userId: string) {
    try {
        await prisma.shift.delete({
            where: { id: shiftId }
        })
        revalidatePath(`/rh/${userId}`)
        return { success: true }
    } catch (e) {
        return { success: false }
    }
}
export async function seedEmployees() {
    const list = [
        "Laura Souchet", "Noélie Souchet", "Amelie Cauchois", "Manon Florent",
        "Laetitia Belal", "Virginie Belal", "Jules Coulon", "Florence Leroy",
        "Lysea Gammiery syda", "Xavier Belal", "Prudencia Kons", "Sylvain Souday",
        "Marie Geoffroy", "Sarah Rosse", "Jenifer Guerra", "Julien Akremann", "Micheline Dupont"
    ]

    try {
        for (const name of list) {
            const email = name.toLowerCase().replace(/\s+/g, '.') + "@restaurant.os"

            // Check if exists
            const existing = await prisma.user.findUnique({ where: { email } })
            if (existing) continue

            await prisma.user.create({
                data: {
                    name,
                    email,
                    role: "STAFF",
                    hourlyRate: 11.65,
                    password: "temp-password-123",
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
    try {
        await prisma.employeeDocument.delete({
            where: { id: docId }
        })
        revalidatePath(`/rh/${userId}`)
        return { success: true }
    } catch (e) {
        return { success: false }
    }
}

export async function updateShift(formData: FormData) {
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
