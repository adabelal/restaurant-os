import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        console.log("Démarrage de la migration des temps de pause...")

        const shifts = await prisma.shift.findMany({
            include: { user: true }
        })

        let updatedCount = 0

        for (const shift of shifts) {
            const isManager = shift.user.name.toLowerCase().includes('adam') || shift.user.name.toLowerCase().includes('benjamin')
            if (isManager) continue

            if (!shift.endTime || !shift.startTime) continue

            const diffMs = shift.endTime.getTime() - shift.startTime.getTime()
            const diffHours = diffMs / (1000 * 60 * 60)

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
                updatedCount++
            }
        }

        return NextResponse.json({ success: true, updatedCount })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
    }
}
