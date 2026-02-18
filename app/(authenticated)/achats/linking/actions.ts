'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function linkItemToIngredient(itemId: string, ingredientId: string) {
    try {
        await prisma.invoiceItem.update({
            where: { id: itemId },
            data: { ingredientId }
        })
        revalidatePath('/achats/linking')
        return { success: true }
    } catch (error) {
        console.error("Link error:", error)
        return { success: false, error: "Erreur de liaison" }
    }
}

export async function createAndLinkIngredient(itemId: string, name: string, unit: string) {
    try {
        // Create new ingredient
        // Note: You might need to adjust this depending on your Ingredient model's required fields
        const ingredient = await prisma.ingredient.create({
            data: {
                name,
                unit: unit as any, // Cast or validate properly versus your enum
                currentStock: 0,
                minStock: 0,
                pricePerUnit: 0,
                category: 'AUTRE' // Default or logic to guess
            }
        })

        // Link it
        await prisma.invoiceItem.update({
            where: { id: itemId },
            data: { ingredientId: ingredient.id }
        })

        revalidatePath('/achats/linking')
        return { success: true, ingredient }
    } catch (error) {
        console.error("Create link error:", error)
        return { success: false, error: "Erreur de création" }
    }
}
