import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { summarizeBandProposal } from "@/lib/gemini"

export async function POST(req: Request) {
    const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "")
    const validKey = process.env.RESTAURANT_OS_API_KEY || process.env.N8N_API_KEY

    if (!validKey || apiKey !== validKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const {
            bandName,
            style,
            contactName,
            contactEmail,
            contactPhone,
            messageId,
            emailDate
        } = body

        if (!bandName || !messageId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Résumé AI si le style est trop long
        const summarizedStyle = await summarizeBandProposal(style || "");

        const proposal = await (prisma as any).musicBandProposal.upsert({
            where: { messageId },
            update: {
                bandName,
                style: summarizedStyle,
                contactName,
                contactEmail,
                contactPhone,
                fullDescription: style,
                emailDate: emailDate ? new Date(emailDate) : new Date()
            },
            create: {
                bandName,
                style: summarizedStyle,
                contactName,
                contactEmail,
                contactPhone,
                fullDescription: style,
                messageId,
                emailDate: emailDate ? new Date(emailDate) : new Date()
            }
        })

        return NextResponse.json({ success: true, id: proposal.id })
    } catch (error: any) {
        console.error("Webook Music Error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
