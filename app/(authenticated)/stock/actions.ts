'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth-utils"
import { createIngredientSchema } from "@/lib/validations"

export async function createIngredient(formData: FormData) {
    await requireAuth()

    const rawData = {
        name: formData.get("name"),
        category: formData.get("category") || "Autre",
        currentStock: formData.get("currentStock") || 0,
        minStock: formData.get("minStock") || 0,
        unit: formData.get("unit") || "KG",
        pricePerUnit: formData.get("price") || 0,
    }

    const result = createIngredientSchema.safeParse(rawData)
    if (!result.success) {
        return { success: false, message: result.error.errors[0].message }
    }

    const data = result.data

    try {
        await prisma.ingredient.create({
            data: {
                name: data.name.trim(),
                category: data.category.trim(),
                currentStock: data.currentStock,
                minStock: data.minStock,
                unit: data.unit,
                pricePerUnit: data.pricePerUnit,
            },
        })

        revalidatePath("/stock")
        return { success: true, message: "Ingrédient créé avec succès." }
    } catch (error: any) {
        console.error("Error creating ingredient:", error)
        return { success: false, message: "Erreur lors de la création de l'ingrédient." }
    }
}

export async function deleteIngredient(formData: FormData) {
    await requireAuth()

    const id = formData.get("id") as string
    if (!id || typeof id !== "string") {
        return { success: false, message: "ID d'ingrédient manquant." }
    }

    try {
        await prisma.ingredient.delete({ where: { id } })
        revalidatePath("/stock")
        return { success: true, message: "Ingrédient supprimé." }
    } catch (error: any) {
        console.error("Failed to delete ingredient", error)
        if (error.code === 'P2025') {
            return { success: false, message: "L'ingrédient n'existe plus." }
        }
        return { success: false, message: "Erreur lors de la suppression de l'ingrédient." }
    }
}

export async function updateIngredient(formData: FormData) {
    await requireAuth()

    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const currentStock = parseFloat(formData.get("currentStock") as string)
    const minStock = parseFloat(formData.get("minStock") as string)
    const unit = formData.get("unit") as "KG" | "L" | "PIECE"
    const price = parseFloat(formData.get("price") as string)

    if (!id || typeof id !== "string") {
        return { success: false, message: "ID d'ingrédient manquant." }
    }

    if (!name || name.trim().length === 0) {
        return { success: false, message: "Nom de l'ingrédient requis." }
    }

    if (isNaN(currentStock) || currentStock < 0) {
        return { success: false, message: "Stock actuel invalide." }
    }

    if (isNaN(price) || price < 0) {
        return { success: false, message: "Prix invalide." }
    }

    try {
        await prisma.ingredient.update({
            where: { id },
            data: {
                name: name.trim(),
                category: category?.trim() || "Autre",
                currentStock,
                minStock: minStock || 0,
                unit,
                pricePerUnit: price,
            },
        })

        revalidatePath("/stock")
        return { success: true, message: "Ingrédient mis à jour avec succès." }
    } catch (error: any) {
        console.error("Error updating ingredient:", error)
        if (error.code === 'P2025') {
            return { success: false, message: "L'ingrédient n'existe plus." }
        }
        return { success: false, message: "Erreur lors de la mise à jour de l'ingrédient." }
    }
}
