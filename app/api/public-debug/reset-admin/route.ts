import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
    try {
        const email = "admin@siwa-bleury.fr" // Email de l'admin
        const newPassword = "admin" // Mot de passe temporaire
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        const user = await prisma.user.upsert({
            where: { email: email.toLowerCase() },
            update: {
                password: hashedPassword,
                isActive: true,
                role: "ADMIN"
            },
            create: {
                email: email.toLowerCase(),
                name: "Admin",
                password: hashedPassword,
                role: "ADMIN",
                isActive: true
            }
        })

        return NextResponse.json({
            success: true,
            message: `Mot de passe réinitialisé pour ${user.email}`,
            tips: "Connectez-vous avec 'admin@siwa-bleury.fr' et 'admin'"
        })
    } catch (error: any) {
        console.error("Reset error:", error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
