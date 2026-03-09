import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetAdmin() {
    const email = 'admin@restaurant-os.com' // Email par défaut, à vérifier dans la BD si différent
    const plainPassword = 'password123'
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                isActive: true,
                role: 'ADMIN'
            },
            create: {
                email,
                name: 'Admin',
                password: hashedPassword,
                role: 'ADMIN',
                isActive: true
            },
        })
        console.log(`Utilisateur mis à jour/créé : ${user.email}`)
        console.log(`Nouveau mot de passe : ${plainPassword}`)
    } catch (error) {
        console.error('Erreur lors du reset :', error)
    } finally {
        await prisma.$disconnect()
    }
}

resetAdmin()
