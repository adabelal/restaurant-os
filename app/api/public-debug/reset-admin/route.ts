import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
    try {
        const emails = ["admin@siwa-bleury.fr", "a.belal@siwa-bleury.fr", "admin@restaurant-os.com"]
        const newPassword = "admin"
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        const results = []
        for (const email of emails) {
            const user = await prisma.user.upsert({
                where: { email: email.toLowerCase() },
                update: {
                    password: hashedPassword,
                    isActive: true,
                    role: "ADMIN"
                },
                create: {
                    email: email.toLowerCase(),
                    name: "Admin " + email.split("@")[0],
                    password: hashedPassword,
                    role: "ADMIN",
                    isActive: true
                }
            })
            results.push(user.email)
        }

        return NextResponse.json({
            success: true,
            message: `Mot de passe réinitialisé pour ${results.join(", ")}`,
            tips: "Connectez-vous avec un de ces emails et le mot de passe 'admin'"
        })
    } catch (error: any) {
        console.error("Reset error:", error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
