/**
 * Script pour créer un utilisateur administrateur initial
 *
 * Usage:
 * npx ts-node scripts/create-admin.ts
 *
 * Ou avec les variables d'environnement:
 * ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=motdepasse123 npx ts-node scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = (process.env.ADMIN_EMAIL || 'admin@restaurant.os').toLowerCase()
    const password = process.env.ADMIN_PASSWORD

    if (!password) {
        console.error('❌ ADMIN_PASSWORD est requis')
        console.log('Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=votre_mot_de_passe npx ts-node scripts/create-admin.ts')
        process.exit(1)
    }

    if (password.length < 8) {
        console.error('❌ Le mot de passe doit contenir au moins 8 caractères')
        process.exit(1)
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser) {
        console.log(`⚠️  L'utilisateur ${email} existe déjà`)

        // Mettre à jour le mot de passe si demandé
        if (process.env.FORCE_UPDATE === 'true') {
            const hashedPassword = await bcrypt.hash(password, 12)
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            })
            console.log('✅ Mot de passe mis à jour')
        }
        return
    }

    // Créer l'utilisateur admin
    const hashedPassword = await bcrypt.hash(password, 12)

    const admin = await prisma.user.create({
        data: {
            name: 'Administrateur',
            email,
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true,
            hourlyRate: 0,
        }
    })

    console.log('✅ Utilisateur administrateur créé:')
    console.log(`   Email: ${admin.email}`)
    console.log(`   Rôle: ${admin.role}`)
    console.log('')
    console.log('⚠️  Conservez ces informations en lieu sûr!')
}

main()
    .catch((e) => {
        console.error('Erreur:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
