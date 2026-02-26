import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
    try {
        // 1. Authentification basique via Bearer Token
        const authHeader = req.headers.get("authorization")
        const apiKey = authHeader?.replace("Bearer ", "")

        if (!process.env.RESTAURANT_OS_API_KEY || apiKey !== process.env.RESTAURANT_OS_API_KEY) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const data = await req.json()
        const { supplierName, date, invoiceNo, totalAmount, scannedUrl, items } = data

        if (!supplierName || !date || totalAmount === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 2. Chercher ou créer le fournisseur (Supplier)
        let supplier = await prisma.supplier.findUnique({
            where: { name: supplierName.toUpperCase() }
        })

        if (!supplier) {
            supplier = await prisma.supplier.create({
                data: {
                    name: supplierName.toUpperCase()
                }
            })
        }

        // 3. Créer la commande d'achat (PurchaseOrder)
        const purchaseOrder = await prisma.purchaseOrder.create({
            data: {
                supplierId: supplier.id,
                date: new Date(date),
                invoiceNo: invoiceNo || null,
                totalAmount: Number(totalAmount),
                status: 'PROCESSING', // En attente de validation humaine
                scannedUrl: scannedUrl,
                // On peut potentiellement rajouter les items ici s'il y en a
                items: items && items.length > 0 ? {
                    create: items.map((item: any) => ({
                        rawLabel: item.name || "A catégoriser",
                        quantity: Number(item.quantity || 1),
                        unitPrice: Number(item.unitPrice || 0),
                        totalPrice: Number(item.totalPrice || 0)
                    }))
                } : undefined
            }
        })

        return NextResponse.json({ success: true, data: purchaseOrder }, { status: 201 })
    } catch (error: any) {
        console.error("Erreur API Import Invoice:", error)
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
    }
}
