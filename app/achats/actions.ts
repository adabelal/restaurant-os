'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { InvoiceStatus } from "@prisma/client"

// --- FETCHING ---

export async function getInvoices() {
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
    try {
        await prisma.purchaseOrder.delete({ where: { id } })
        revalidatePath('/achats')
        return { success: true }
    } catch (e) {
        return { success: false, error: String(e) }
    }
}

// --- INTELLIGENT PROCESSING (Placeholder for N8N/AI) ---
// This function will be called when a file is uploaded
export async function processUploadedInvoice(formData: FormData) {
    try {
        const file = formData.get('file') as File
        if (!file) throw new Error("No file uploaded")

        // TODO: 
        // 1. Upload file to S3/Blob storage
        // 2. Trigger N8N webhook OR use Local AI to parse
        // 3. Save result

        // MOCK IMPLEMENTATION FOR DEMO
        console.log("Processing file:", file.name)

        return { success: true, message: "Fichier reçu. L'OCR sera connectée prochainement." }
    } catch (e) {
        return { success: false, error: String(e) }
    }
}
