"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Zod schemas for validation
const BandSchema = z.object({
    name: z.string().min(1, "Le nom est requis"),
    genre: z.string().optional(),
    contact: z.string().optional(),
})

const EventSchema = z.object({
    bandId: z.string().min(1, "Le groupe est requis"),
    date: z.string().min(1, "La date est requise"), // Will be parsed to Date
    startTime: z.string().optional(),
    amount: z.coerce.number().min(0, "Le montant doit être positif"),
    paymentMethod: z.string().min(1, "Le mode de paiement est requis"),
    invoiceStatus: z.string().min(1, "Le statut de facture est requis"),
    status: z.string().default("SCHEDULED"),
    notes: z.string().optional(),
})

export async function createBand(formData: FormData) {
    const rawData = {
        name: formData.get("name"),
        genre: formData.get("genre"),
        contact: formData.get("contact"),
    }

    const result = BandSchema.safeParse(rawData)

    if (!result.success) {
        return { error: result.error.flatten().fieldErrors }
    }

    try {
        await prisma.musicBand.create({
            data: {
                name: result.data.name,
                genre: result.data.genre,
                contact: result.data.contact,
            },
        })
        revalidatePath("/music")
        return { success: true }
    } catch (error) {
        console.error("Failed to create band:", error)
        return { error: "Failed to create band" }
    }
}

export async function createEvent(formData: FormData) {
    const rawData = {
        bandId: formData.get("bandId"),
        date: formData.get("date"),
        startTime: formData.get("startTime"),
        amount: formData.get("amount"),
        paymentMethod: formData.get("paymentMethod"),
        invoiceStatus: formData.get("invoiceStatus"),
        status: formData.get("status") || "SCHEDULED",
        notes: formData.get("notes"),
    }

    const result = EventSchema.safeParse(rawData)

    if (!result.success) {
        return { error: result.error.flatten().fieldErrors }
    }

    try {
        await prisma.musicEvent.create({
            data: {
                bandId: result.data.bandId,
                date: new Date(result.data.date),
                startTime: result.data.startTime,
                amount: result.data.amount,
                paymentMethod: result.data.paymentMethod,
                invoiceStatus: result.data.invoiceStatus,
                status: result.data.status,
                notes: result.data.notes,
            },
        })
        revalidatePath("/music")
        return { success: true }
    } catch (error) {
        console.error("Failed to create event:", error)
        return { error: "Failed to create event" }
    }
}

export async function getBands() {
    try {
        const bands = await prisma.musicBand.findMany({
            orderBy: { name: "asc" },
            include: {
                events: {
                    orderBy: { date: "desc" },
                    take: 5, // Show last 5 events
                },
            },
        })
        return bands
    } catch (error) {
        console.error("Failed to fetch bands:", error)
        return []
    }
}

export async function getEvents() {
    try {
        const events = await prisma.musicEvent.findMany({
            orderBy: { date: "desc" },
            include: {
                band: true,
            },
        })
        return events
    } catch (error) {
        console.error("Failed to fetch events:", error)
        return []
    }
}

export async function updateEventStatus(eventId: string, status: string, invoiceStatus?: string) {
    try {
        await prisma.musicEvent.update({
            where: { id: eventId },
            data: {
                status,
                ...(invoiceStatus && { invoiceStatus })
            }
        })
        revalidatePath("/music")
        return { success: true }
    } catch (error) {
        console.error("Failed to update event:", error)
        return { error: "Failed to update event" }
    }
}
