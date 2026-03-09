"use server"

import { prisma } from "@/lib/prisma"
import { safeAction } from "@/lib/safe-action"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const UpdateProfileSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
})

const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z.string().min(6, "La confirmation doit contenir au moins 6 caractères"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
})

export async function updateProfile(data: z.infer<typeof UpdateProfileSchema>) {
    return safeAction(data, async (input) => {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return { error: "Non autorisé" }

        try {
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    name: input.name,
                    email: input.email.toLowerCase(),
                },
            })
            revalidatePath("/settings")
            return { success: true }
        } catch (error) {
            console.error("Update profile error:", error)
            return { error: "Erreur lors de la mise à jour du profil" }
        }
    })
}

export async function changePassword(data: z.infer<typeof ChangePasswordSchema>) {
    return safeAction(data, async (input) => {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return { error: "Non autorisé" }

        try {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { password: true },
            })

            if (!user) return { error: "Utilisateur non trouvé" }

            const passwordMatch = await bcrypt.compare(input.currentPassword, user.password)
            if (!passwordMatch) return { error: "Mot de passe actuel incorrect" }

            const hashedPassword = await bcrypt.hash(input.newPassword, 12)
            await prisma.user.update({
                where: { id: session.user.id },
                data: { password: hashedPassword },
            })

            return { success: true }
        } catch (error) {
            console.error("Change password error:", error)
            return { error: "Erreur lors du changement de mot de passe" }
        }
    })
}
