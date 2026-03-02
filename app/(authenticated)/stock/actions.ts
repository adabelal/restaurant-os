'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth-utils"
import { createIngredientSchema } from "@/lib/validations"
import { safeAction } from "@/lib/safe-action"

export async function createIngredient(formData: FormData) {
    return safeAction(formData, async (input) => {
        const rawData = {
            name: input.get("name"),
            category: input.get("category") || "Autre",
            currentStock: input.get("currentStock") || 0,
            minStock: input.get("minStock") || 0,
            unit: input.get("unit") || "KG",
            pricePerUnit: input.get("price") || 0,
        }

        const result = createIngredientSchema.safeParse(rawData)
        if (!result.success) {
            return { error: result.error.errors[0].message }
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
            return { error: "Erreur lors de la création de l'ingrédient." }
        }
    })
}

export async function deleteIngredient(formData: FormData) {
    return safeAction(formData, async (input) => {
        const id = input.get("id") as string
        if (!id || typeof id !== "string") {
            return { error: "ID d'ingrédient manquant." }
        }

        try {
            await prisma.ingredient.delete({ where: { id } })
            revalidatePath("/stock")
            return { success: true, message: "Ingrédient supprimé." }
        } catch (error: any) {
            console.error("Failed to delete ingredient", error)
            if (error.code === 'P2025') {
                return { error: "L'ingrédient n'existe plus." }
            }
            return { error: "Erreur lors de la suppression de l'ingrédient." }
        }
    })
}

export async function updateIngredient(formData: FormData) {
    return safeAction(formData, async (input) => {
        const id = input.get("id") as string
        const name = input.get("name") as string
        const category = input.get("category") as string
        const currentStock = parseFloat(input.get("currentStock") as string)
        const minStock = parseFloat(input.get("minStock") as string)
        const unit = input.get("unit") as "KG" | "L" | "PIECE"
        const price = parseFloat(input.get("price") as string)

        if (!id || typeof id !== "string") {
            return { error: "ID d'ingrédient manquant." }
        }

        if (!name || name.trim().length === 0) {
            return { error: "Nom de l'ingrédient requis." }
        }

        if (isNaN(currentStock) || currentStock < 0) {
            return { error: "Stock actuel invalide." }
        }

        if (isNaN(price) || price < 0) {
            return { error: "Prix invalide." }
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
                return { error: "L'ingrédient n'existe plus." }
            }
            return { error: "Erreur lors de la mise à jour de l'ingrédient." }
        }
    })
}
