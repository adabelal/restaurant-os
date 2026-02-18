'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { InvoiceStatus } from "@prisma/client"
import { requireAuth } from "@/lib/auth-utils"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// --- FETCHING ---

export async function getInvoices() {
    await requireAuth()
    return await prisma.purchaseOrder.findMany({
        orderBy: { date: 'desc' },
        include: {
            supplier: true,
            items: {
                include: { ingredient: true }
            }
        }
    })
}

export async function getSuppliers() {
    await requireAuth()
    return await prisma.supplier.findMany({
        orderBy: { name: 'asc' }
    })
}

// --- CREATION / UPDATE ---

export async function createManualInvoice(data: {
    supplierId?: string,
    date: Date,
    invoiceNo?: string,
    totalAmount: number,
    status: InvoiceStatus
}) {
    await requireAuth()
    try {
        await prisma.purchaseOrder.create({
            data: {
                supplierId: data.supplierId,
                date: data.date,
                invoiceNo: data.invoiceNo,
                totalAmount: data.totalAmount,
                status: data.status
            }
        })
        revalidatePath('/achats')
        return { success: true }
    } catch (e) {
        return { success: false, error: String(e) }
    }
}

export async function deleteInvoice(id: string) {
    await requireAuth()
    try {
        await prisma.purchaseOrder.delete({ where: { id } })
        revalidatePath('/achats')
        return { success: true }
    } catch (e) {
        return { success: false, error: String(e) }
    }
}

// --- INTELLIGENT PROCESSING (Gemini OCR) ---

export async function processInvoice(base64Image: string) {
    await requireAuth()

    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: "Clé API Gemini manquante dans les variables d'environnement." }
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const prompt = `
            Tu es un expert comptable et un spécialiste de la saisie de factures pour restaurants.
            Analyse cette image de facture fournisseur et extrais les données avec une précision extrême.
            
            Format de réponse attendu (JSON uniquement) :
            {
                "supplierName": "NOM DU FOURNISSEUR (ex: METRO, PROMOCASH...)",
                "invoiceNo": "NUMERO DE FACTURE",
                "date": "YYYY-MM-DD (Date d'émission)",
                "totalAmount": 0.00 (Montant TTC exact),
                "tvaAmount": 0.00 (Montant total TVA),
                "paymentMethod": "CB, VIREMENT, ESPECES, ou PRELEVEMENT",
                "items": [
                    { 
                        "name": "DESCRIPTION PRECISE DE L'ARTICLE", 
                        "code": "REF_ARTICLE (si dispo)",
                        "quantity": 0.0, 
                        "unit": "kg/L/U (si détecté, sinon U)",
                        "unitPrice": 0.00 (Prix unitaire HT), 
                        "tvaRate": 0.0 (Taux TVA: 5.5, 10, 20...),
                        "totalPrice": 0.00 (Prix total HT) 
                    }
                ]
            }

            Règles strictes :
            1. Si une information est illisible ou manquante, mets null.
            2. Le montant total doit être le TTC (Toutes Taxes Comprises).
            3. Les prix des articles sont généralement HT (Hors Taxe) sur les factures de gros (Metro, etc.), mais vérifie bien les colonnes.
            4. Ne sois pas créatif, sois factuel. Si tu as un doute sur un chiffre, ne l'invente pas.
            5. Essaye de nettoyer les noms d'articles (enlève les codes bizarres au début si possible).
            6. Réponds UNIQUEMENT avec le JSON validé.
        `

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image.split(",")[1],
                    mimeType: "image/jpeg"
                }
            }
        ])

        const response = await result.response
        const text = response.text().replace(/```json|```/g, "").trim()
        const data = JSON.parse(text)

        return { success: true, data }
    } catch (error) {
        console.error("OCR Error:", error)
        return { success: false, error: "Erreur lors de l'analyse de l'image par l'IA." }
    }
}

export async function saveScannedInvoice(data: any) {
    await requireAuth()
    try {
        // Find or create supplier
        let supplier = await prisma.supplier.findUnique({
            where: { name: data.supplierName }
        })

        if (!supplier) {
            supplier = await prisma.supplier.create({
                data: { name: data.supplierName }
            })
        }

        // Create PurchaseOrder
        const order = await prisma.purchaseOrder.create({
            data: {
                supplierId: supplier.id,
                date: new Date(data.date || Date.now()),
                invoiceNo: data.invoiceNo,
                totalAmount: data.totalAmount,
                paymentMethod: data.paymentMethod,
                status: "VALIDATED"
            }
        })

        // Create items
        if (data.items && data.items.length > 0) {
            await prisma.invoiceItem.createMany({
                data: data.items.map((item: any) => ({
                    purchaseOrderId: order.id,
                    rawLabel: item.name,
                    quantity: item.quantity || 1,
                    unitPrice: item.unitPrice || item.totalPrice,
                    totalPrice: item.totalPrice,
                    packaging: item.unit || null // Map detected unit to packaging
                }))
            })
        }

        revalidatePath("/achats")
        return { success: true, id: order.id }
    } catch (error) {
        console.error("Save Error:", error)
        return { success: false, error: "Erreur lors de l'enregistrement de la facture." }
    }
}
