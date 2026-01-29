import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
    const adminEmail = "a.belal@siwa-bleury.fr"

    try {
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        })

        if (existingAdmin) {
            // Si l'utilisateur existe déjà mais n'a pas de mot de passe sécurisé (ex: "temp-password-123")
            // ou si vous voulez simplement le réinitialiser
            const hashedPassword = await bcrypt.hash("Siwa2024!", 10)
            await prisma.user.update({
                where: { email: adminEmail },
                data: {
                    password: hashedPassword,
                    role: "ADMIN",
                    isActive: true
                }
            })
            return NextResponse.json({ message: "Admin mis à jour" })
        }

        const hashedPassword = await bcrypt.hash("Siwa2024!", 10)
        await prisma.user.create({
            data: {
                email: adminEmail,
                name: "Adam Belal",
                password: hashedPassword,
                role: "ADMIN",
                isActive: true
            }
        })

        return NextResponse.json({ message: "Admin créé avec succès" })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Erreur lors de la création de l'admin" }, { status: 500 })
    }
}
