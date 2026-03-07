import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const apiKey = req.headers.get("authorization")?.replace("Bearer ", "");
        const expectedKey = process.env.RESTAURANT_OS_API_KEY;

        if (!apiKey || apiKey !== expectedKey) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();

        const {
            bandName,
            style,
            contactName,
            contactEmail,
            contactPhone,
            videoLinks,
            fullDescription,
            emailDate,
            messageId,
        } = data;

        if (!bandName || !messageId) {
            return NextResponse.json(
                { error: "Missing required fields (bandName, messageId)" },
                { status: 400 }
            );
        }

        // Upsert to handle potential re-syncs or updates
        const proposal = await prisma.musicBandProposal.upsert({
            where: { messageId },
            update: {
                bandName,
                style,
                contactName,
                contactEmail,
                contactPhone,
                videoLinks,
                fullDescription,
                emailDate: new Date(emailDate),
            },
            create: {
                bandName,
                style,
                contactName,
                contactEmail,
                contactPhone,
                videoLinks,
                fullDescription,
                emailDate: new Date(emailDate),
                messageId,
            },
        });

        console.log(`🎸 Proposition musicale enregistrée : ${bandName}`);

        return NextResponse.json({
            success: true,
            id: proposal.id,
        });
    } catch (error) {
        console.error("❌ Erreur webhook music-proposals:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
