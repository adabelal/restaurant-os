import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    const apiKey = req.headers.get("x-api-key")
    const validKey = process.env.RESTAURANT_OS_API_KEY || process.env.N8N_API_KEY

    if (!validKey || apiKey !== validKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { date, amount, description, messageId, sender, subject } = body

        if (!date || amount === undefined) {
            return NextResponse.json({ error: "Missing date or amount" }, { status: 400 })
        }

        // 1. Trouver ou créer la catégorie "Recettes" dans FinanceCategory
        const categoryName = "Recettes"
        const categoryType = "REVENUE"

        console.log(`[Popina Webhook] Recherche de la catégorie: ${categoryName}`);
        let category = await prisma.financeCategory.findUnique({
            where: { name: categoryName }
        })

        if (!category) {
            console.log(`[Popina Webhook] Catégorie non trouvée, création...`);
            category = await prisma.financeCategory.create({
                data: {
                    name: categoryName,
                    type: categoryType,
                    color: "emerald"
                }
            })
        }

        console.log(`[Popina Webhook] Catégorie ID utilisée: ${category.id}`);

        // 2. Vérifier si une transaction identique existe déjà (par messageId ou date/montant)
        if (messageId) {
            const existingMail = await (prisma as any).processedMail.findUnique({
                where: { messageId }
            })
            if (existingMail) {
                return NextResponse.json({ success: true, message: "Mail already processed", id: existingMail.id })
            }
        }

        const parsedDate = new Date(date)
        const existing = await prisma.cashTransaction.findFirst({
            where: {
                date: {
                    gte: new Date(new Date(parsedDate).setHours(0, 0, 0, 0)),
                    lte: new Date(new Date(parsedDate).setHours(23, 59, 59, 999))
                },
                amount: amount,
                description: description
            }
        })

        if (existing) {
            return NextResponse.json({ success: true, message: "Transaction already exists", id: existing.id })
        }

        // 3. Créer la transaction
        let transaction;
        try {
            transaction = await prisma.cashTransaction.create({
                data: {
                    date: new Date(date),
                    amount: amount,
                    type: "IN",
                    description: description || "Recette Popina (Espèces)",
                    categoryId: category.id
                }
            })
        } catch (e: any) {
            console.error("[Popina Webhook] Erreur lors de la création avec catégorie:", e.message);
            console.log("[Popina Webhook] Tentative de création SANS catégorie pour sauver les données...");

            // Tentative de secours sans categoryId (si c'est bien la FK qui bloque)
            transaction = await prisma.cashTransaction.create({
                data: {
                    date: new Date(date),
                    amount: amount,
                    type: "IN",
                    description: (description || "Recette Popina (Espèces)") + " [Erreur Catégorie]"
                }
            });
        }

        // 4. Enregistrer dans ProcessedMail pour l'historique
        if (messageId) {
            try {
                await (prisma as any).processedMail.create({
                    data: {
                        messageId: messageId,
                        subject: subject || description || "Rapport Popina",
                        sender: sender || "Popina",
                        date: new Date(date),
                        type: "POPINA_REPORT",
                        amount: amount,
                        targetId: transaction.id,
                        status: "SUCCESS"
                    }
                })
            } catch (e) {
                console.warn("Impossible de logger dans ProcessedMail (table manquante ?)");
            }
        }

        return NextResponse.json({ success: true, id: transaction.id })
    } catch (error: any) {
        console.error("Popina Webhook Error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
