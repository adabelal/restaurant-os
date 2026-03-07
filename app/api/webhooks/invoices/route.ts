import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    // Sécurité: Vérification de la clé API (Accepte x-api-key ou Authorization: Bearer)
    const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "")
    const validKey = process.env.RESTAURANT_OS_API_KEY || process.env.N8N_API_KEY

    if (!validKey || apiKey !== validKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const {
            supplierName,
            date,
            invoiceNo,
            totalAmount,
            items,
            scannedUrl,
            paymentMethod,
            deliveryMode,
            isFinancial = true, // Par défaut on assume que c'est une facture si non précisé
            fileName,
            emailMetadata
        } = body

        let targetId = null;
        let finalStatus = 'SUCCESS';

        // 1. Uniquement si c'est un document financier (Facture, Avoir, Relevé)
        if (isFinancial) {
            // Trouver ou créer le fournisseur
            let supplier: any = null
            if (supplierName) {
                supplier = await (prisma as any).supplier.upsert({
                    where: { name: supplierName },
                    update: {},
                    create: { name: supplierName }
                })
            }

            // Créer la facture (PurchaseOrder)
            const purchaseOrder: any = await (prisma as any).purchaseOrder.create({
                data: {
                    supplierId: supplier?.id,
                    date: date ? new Date(date) : new Date(),
                    invoiceNo: invoiceNo,
                    totalAmount: totalAmount || 0,
                    status: 'PROCESSING',
                    scannedUrl: scannedUrl,
                    paymentMethod: paymentMethod,
                    deliveryMode: deliveryMode
                }
            })
            targetId = purchaseOrder.id;

            // Traiter les articles et détecter les alertes
            let hasAlert = false
            const invoiceItemsData = []

            if (items && Array.isArray(items)) {
                for (const item of items) {
                    const unitPrice = parseFloat(item.unitPrice)
                    const ingredient: any = await (prisma as any).ingredient.findFirst({
                        where: { name: { contains: item.label, mode: 'insensitive' } }
                    })

                    let priceVariation = null
                    if (ingredient && Number(ingredient.pricePerUnit) > 0) {
                        const oldPrice = Number(ingredient.pricePerUnit)
                        const variation = ((unitPrice - oldPrice) / oldPrice) * 100
                        priceVariation = variation
                        if (variation > 5) hasAlert = true

                        await (prisma as any).ingredient.update({
                            where: { id: ingredient.id },
                            data: { pricePerUnit: unitPrice }
                        })
                    }

                    invoiceItemsData.push({
                        purchaseOrderId: purchaseOrder.id,
                        rawLabel: item.label,
                        ingredientId: ingredient?.id,
                        quantity: item.quantity || 1,
                        unitPrice: unitPrice,
                        totalPrice: item.totalPrice || (unitPrice * (item.quantity || 1)),
                        packaging: item.packaging,
                        priceVariation: priceVariation
                    })
                }

                if (invoiceItemsData.length > 0) {
                    await (prisma as any).invoiceItem.createMany({
                        data: invoiceItemsData
                    })
                }
            }

            // Mettre à jour le statut final du document financier
            finalStatus = hasAlert ? 'ALERT' : 'VALIDATED';
            await (prisma as any).purchaseOrder.update({
                where: { id: purchaseOrder.id },
                data: { status: finalStatus === 'VALIDATED' ? 'VALIDATED' : 'ALERT' }
            })
        }

        // 2. Enregistrer dans ProcessedMail (pour TOUS les documents)
        if (emailMetadata) {
            await (prisma as any).processedMail.upsert({
                where: { messageId: emailMetadata.messageId },
                update: {
                    status: finalStatus === 'VALIDATED' ? 'SUCCESS' : finalStatus,
                    amount: totalAmount || 0,
                    targetId: targetId,
                    fileName: fileName
                },
                create: {
                    messageId: emailMetadata.messageId,
                    subject: emailMetadata.subject || "Sans objet",
                    sender: emailMetadata.sender || "Inconnu",
                    date: date ? new Date(date) : new Date(),
                    type: isFinancial ? "INVOICE" : "DOCUMENT",
                    status: finalStatus === 'VALIDATED' ? 'SUCCESS' : finalStatus,
                    amount: totalAmount || 0,
                    targetId: targetId,
                    fileUrl: scannedUrl,
                    fileName: fileName
                }
            })
        }

        return NextResponse.json({ success: true, id: targetId, status: finalStatus })
    } catch (error: any) {
        console.error("Webhook Error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
