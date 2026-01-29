'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createIngredient(formData: FormData) {
    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const currentStock = parseFloat(formData.get("currentStock") as string) || 0
    const minStock = parseFloat(formData.get("minStock") as string) || 0
    const unit = formData.get("unit") as "KG" | "L" | "PIECE"
    const price = parseFloat(formData.get("price") as string) || 0

    if (!name) return { success: false, message: "Nom de l'ingrédient requis." }

    try {
        await prisma.ingredient.create({
            data: {
                name,
                category,
                currentStock,
                minStock,
                unit: unit || "KG",
                pricePerUnit: price,
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
    const id = formData.get("id") as string
    if (!id) return { success: false, message: "ID d'ingrédient manquant." };

    try {
        await prisma.ingredient.delete({ where: { id } })
        revalidatePath("/stock")
        return { success: true, message: "Ingrédient supprimé." }
    } catch (error: any) {
        console.error("Failed to delete ingredient", error)
        if (error.code === 'P2025') {
            return { success: false, message: "L'ingrédient n'existe plus." };
        }
        return { success: false, message: "Erreur lors de la suppression de l'ingrédient." }
    }
}

export async function updateIngredient(formData: FormData) {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const currentStock = parseFloat(formData.get("currentStock") as string);
    const minStock = parseFloat(formData.get("minStock") as string);
    const unit = formData.get("unit") as "KG" | "L" | "PIECE";
    const price = parseFloat(formData.get("price") as string);

    if (!id || !name) return { success: false, message: "ID et nom de l'ingrédient requis." };

    try {
        await prisma.ingredient.update({
            where: { id },
            data: {
                name,
                category,
                currentStock,
                minStock,
                unit,
                pricePerUnit: price,
            },
        });

        revalidatePath("/stock");
        return { success: true, message: "Ingrédient mis à jour avec succès." };
    } catch (error: any) {
        console.error("Error updating ingredient:", error);
        if (error.code === 'P2025') {
            return { success: false, message: "L'ingrédient n'existe plus." };
        }
        return { success: false, message: "Erreur lors de la mise à jour de l'ingrédient." };
    }
}
