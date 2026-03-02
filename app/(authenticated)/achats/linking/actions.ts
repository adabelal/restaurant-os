'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { safeAction } from "@/lib/safe-action"

export async function linkItemToIngredient(itemId: string, ingredientId: string) {
    return safeAction({ itemId, ingredientId }, async (input) => {
        try {
            await prisma.invoiceItem.update({
                where: { id: input.itemId },
                data: { ingredientId: input.ingredientId }
            })
            revalidatePath('/achats/linking')
            return { success: true }
        } catch (error) {
            console.error("Link error:", error)
            return { error: "Erreur de liaison" }
        }
    })
}

export async function createAndLinkIngredient(itemId: string, name: string, unit: string) {
    return safeAction({ itemId, name, unit }, async (input) => {
        try {
            // Create new ingredient
            // Note: You might need to adjust this depending on your Ingredient model's required fields
            const ingredient = await prisma.ingredient.create({
                data: {
                    name: input.name,
                    unit: input.unit as any, // Cast or validate properly versus your enum
                    currentStock: 0,
                    minStock: 0,
                    pricePerUnit: 0,
                    category: 'AUTRE' // Default or logic to guess
                }
            })

            // Link it
            await prisma.invoiceItem.update({
                where: { id: input.itemId },
                data: { ingredientId: ingredient.id }
            })

            revalidatePath('/achats/linking')
            return { success: true, ingredient }
        } catch (error) {
            console.error("Create link error:", error)
            return { error: "Erreur de création" }
        }
    })
}
