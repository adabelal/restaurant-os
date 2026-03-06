import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Démarrage de la migration des temps de pause...")

    // Récupérer tous les shifts avec les infos utilisateur
    const shifts = await prisma.shift.findMany({
        include: {
            user: true
        }
    })

    let updatedCount = 0

    for (const shift of shifts) {
        // Ignorer les gérants
        const isManager = shift.user.name.toLowerCase().includes('adam') || shift.user.name.toLowerCase().includes('benjamin')
        if (isManager) continue

        // Ignorer les shifts non complets
        if (!shift.endTime || !shift.startTime) continue

        const diffMs = shift.endTime.getTime() - shift.startTime.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)

        // Si plus de 6 heures et pause inférieure à 20 minutes
        if (diffHours > 6 && shift.breakMinutes < 20) {
            const missingBreak = 20 - shift.breakMinutes
            const newEndTime = new Date(shift.endTime.getTime())
            newEndTime.setMinutes(newEndTime.getMinutes() + missingBreak)

            await prisma.shift.update({
                where: { id: shift.id },
                data: {
                    breakMinutes: 20,
                    endTime: newEndTime
                }
            })

            console.log(`Shift ${shift.id} (User: ${shift.user.name}) mis à jour. Pause passée de ${shift.breakMinutes} à 20. Heure de fin modifiée de ${shift.endTime.toLocaleTimeString('fr-FR')} à ${newEndTime.toLocaleTimeString('fr-FR')}.`)
            updatedCount++
        }
    }

    console.log(`Migration terminée. ${updatedCount} shifts mis à jour.`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
