import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        console.log("Démarrage de la migration des temps de pause...")
        const shifts = await prisma.shift.findMany({
            where: { breakMinutes: 0 }
        })
        
        let count = 0
        for (const shift of shifts) {
            const diffMs = shift.endTime.getTime() - shift.startTime.getTime()
            const diffHours = diffMs / (1000 * 60 * 60)
            
            if (diffHours > 6) {
                await prisma.shift.update({
                    where: { id: shift.id },
                    data: { breakMinutes: 20 }
                })
                count++
            }
        }
        
        return NextResponse.json({ success: true, migrated: count })
    } catch (e: any) {
        console.error(e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
