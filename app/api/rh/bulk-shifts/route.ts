import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// One-time bulk insert of historical shifts from CSV data
// DELETE THIS FILE AFTER USE
export async function POST(req: Request) {
    try {
        const { shifts } = await req.json()

        if (!shifts || !Array.isArray(shifts)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        // Fetch all users for name matching
        const users = await prisma.user.findMany({ select: { id: true, name: true } })
        const userMap: Record<string, string> = {}
        users.forEach(u => { userMap[u.name] = u.id })

        let inserted = 0
        let skipped = 0
        const unmatched: string[] = []

        for (const s of shifts) {
            // Find user by name (exact or partial)
            let uid = userMap[s.employee]
            if (!uid) {
                const match = users.find(u =>
                    u.name.toLowerCase().includes(s.employee.toLowerCase()) ||
                    s.employee.toLowerCase().includes(u.name.toLowerCase().split(' ')[0])
                )
                if (match) uid = match.id
            }

            if (!uid) {
                if (!unmatched.includes(s.employee)) unmatched.push(s.employee)
                skipped++
                continue
            }

            // Parse date & times
            const [dd, mm, yyyy] = s.date.split('/')
            const dateStr = `${yyyy}-${mm}-${dd}`
            const startDt = new Date(`${dateStr}T${s.start}:00`)
            const endDt = new Date(`${dateStr}T${s.end}:00`)
            const isWeekend = startDt.getDay() === 0 // Sunday

            await prisma.shift.create({
                data: {
                    userId: uid,
                    startTime: startDt,
                    endTime: endDt,
                    breakMinutes: parseInt(s.break_min),
                    hourlyRate: parseFloat(s.hourly_rate),
                    isSunday: isWeekend,
                    status: 'COMPLETED',
                }
            })
            inserted++
        }

        return NextResponse.json({ inserted, skipped, unmatched })
    } catch (e: any) {
        console.error(e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
