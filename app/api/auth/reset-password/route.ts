
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json()

        if (!token || !password) {
            return NextResponse.json({ error: "Token et mot de passe requis" }, { status: 400 })
        }

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    gt: new Date(),
                },
            },
        })

        if (!user) {
            return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        })

        return NextResponse.json({ message: "Mot de passe mis à jour avec succès" })

    } catch (error) {
        console.error("Erreur reset password:", error)
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
    }
}
