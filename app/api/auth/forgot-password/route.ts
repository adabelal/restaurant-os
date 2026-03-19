
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ error: "Email requis" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
            // Pour des raisons de sécurité, on répond toujours succès même si l'email n'existe pas
            return NextResponse.json({ message: "Si cet email existe, un lien a été envoyé." })
        }

        // Générer un token unique
        const resetToken = crypto.randomBytes(32).toString("hex")
        const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 heure

        // Sauvegarder dans la DB
        await prisma.user.update({
            where: { email },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: resetTokenExpiry,
            },
        })

        // Envoyer l'email via Resend API (Fetch direct pour éviter dépendances npm)
        const resendApiKey = process.env.RESEND_API_KEY
        const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"


        if (resendApiKey) {
            const resetUrl = `${appUrl}/reset-password?token=${resetToken}`

            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${resendApiKey}`,
                },
                body: JSON.stringify({
                    from: "Siwa-OS <noreply@siwa-bleury.fr>",
                    to: [email],
                    subject: "Réinitialisation de votre mot de passe",
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Réinitialisation de mot de passe</h2>
                            <p>Bonjour ${user.name},</p>
                            <p>Vous avez demandé à réinitialiser votre mot de passe pour Siwa-OS.</p>
                            <p>Cliquez sur le lien ci-dessous, ou copiez-le dans votre navigateur :</p>
                            <a href="${resetUrl}">${resetUrl}</a>
                            <p>Ce lien expirera dans 1 heure.</p>
                            <p style="font-size: 12px; color: #666;">Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
                        </div>
                    `,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error("Erreur Resend:", errorData)
                // On ne retourne pas l'erreur au client pour ne pas exposer l'infra
            } else {
                console.log("✅ Email de réinitialisation envoyé avec succès via Resend")
            }
        } else {
            console.warn("⚠️ RESEND_API_KEY manquant. Le lien ne peut pas être envoyé.")
            console.log("🔗 LIEN DE RESET (DEV ONLY):", `${appUrl}/reset-password?token=${resetToken}`)
        }

        return NextResponse.json({ message: "Si cet email existe, un lien a été envoyé." })

    } catch (error) {
        console.error("Erreur forgot password:", error)
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
    }
}
