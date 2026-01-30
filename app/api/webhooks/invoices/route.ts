import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
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
            deliveryMode
        } = body

        // 1. Trouver ou créer le fournisseur
        let supplier: any = null
        if (supplierName) {
            supplier = await (prisma as any).supplier.upsert({
                where: { name: supplierName },
                update: {},
                create: { name: supplierName }
            })
        }

        // 2. Créer la facture (PurchaseOrder)
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

        // 3. Traiter les articles et détecter les alertes
        let hasAlert = false
        const invoiceItemsData = []

        for (const item of items) {
            const unitPrice = parseFloat(item.unitPrice)

            // Chercher si cet ingrédient existe déjà (par son nom)
            const ingredient: any = await (prisma as any).ingredient.findFirst({
                where: { name: { contains: item.label, mode: 'insensitive' } }
            })

            let priceVariation = null
            if (ingredient && Number(ingredient.pricePerUnit) > 0) {
                const oldPrice = Number(ingredient.pricePerUnit)
                const variation = ((unitPrice - oldPrice) / oldPrice) * 100
                priceVariation = variation

                // Si la hausse est supérieure à 5%
                if (variation > 5) {
                    hasAlert = true
                }

                // Mettre à jour le prix de l'ingrédient
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

        // Création groupée des items
        await (prisma as any).invoiceItem.createMany({
            data: invoiceItemsData
        })

        // 4. Mettre à jour le statut final
        await (prisma as any).purchaseOrder.update({
            where: { id: purchaseOrder.id },
            data: { status: hasAlert ? 'ALERT' : 'VALIDATED' }
        })

        return NextResponse.json({ success: true, id: purchaseOrder.id, alert: hasAlert })
    } catch (error: any) {
        console.error("Webhook Error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
