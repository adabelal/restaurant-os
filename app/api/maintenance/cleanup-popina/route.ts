import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get("secret")
    
    if (secret !== process.env.RESTAURANT_OS_API_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        console.log("[Maintenance] Starting Popina tips cleanup...");

        // 1. Identifier les transactions à garder
        // 07/06/2025 15:48 pour 0.20€
        // 14/06/2025 16:55 pour 0.18€
        
        const date1 = new Date("2025-06-07")
        const date2 = new Date("2025-06-14")
        
        const exemptions = await prisma.cashTransaction.findMany({
            where: {
                OR: [
                    {
                        date: {
                            gte: new Date("2025-06-07T00:00:00Z"),
                            lte: new Date("2025-06-07T23:59:59Z")
                        },
                        amount: 0.20
                    },
                    {
                        date: {
                            gte: new Date("2025-06-14T00:00:00Z"),
                            lte: new Date("2025-06-14T23:59:59Z")
                        },
                        amount: 0.18
                    }
                ]
            }
        })
        
        const exemptionIds = exemptions.map(e => e.id)
        console.log(`[Maintenance] Exempted IDs: ${exemptionIds.join(", ")}`);

        // 2. Supprimer les autres transactions "Pourboire" ou "Popina"
        const deleteResult = await prisma.cashTransaction.deleteMany({
            where: {
                AND: [
                    {
                        OR: [
                            { description: { contains: "Pourboire", mode: "insensitive" } },
                            { description: { contains: "Popina", mode: "insensitive" } }
                        ]
                    },
                    {
                        id: { notIn: exemptionIds }
                    }
                ]
            }
        })

        // 3. Supprimer les ProcessedMail de type POPINA_REPORT qui ne sont pas liés aux exemptions
        const deleteMailResult = await (prisma as any).processedMail.deleteMany({
            where: {
                AND: [
                    { type: "POPINA_REPORT" },
                    { targetId: { notIn: exemptionIds } }
                ]
            }
        })

        return NextResponse.json({
            success: true,
            deletedTransactions: deleteResult.count,
            deletedMails: deleteMailResult.count,
            exemptedCount: exemptionIds.length
        })
    } catch (error: any) {
        console.error("[Maintenance] Cleanup Error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
