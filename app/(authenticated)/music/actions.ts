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

/**
 * IMPORTATION DEPUIS CSV (VERSION 2)
 * Fonction temporaire pour contourner les problèmes de permissions du terminal.
 * À déclencher via un effet de bord ou un bouton caché en développement.
 */
export async function importMusicDataV2(csvContent: string) {
    try {
        console.log("--- Début Importation Musique v2 ---");

        // Nettoyage
        await prisma.musicEvent.deleteMany();
        await prisma.musicBand.deleteMany();

        const lines = csvContent.split('\n');
        const dataLines = lines.slice(1); // Sauter l'en-tête

        let bandCount = 0;
        let eventCount = 0;

        for (const line of dataLines) {
            if (!line.trim()) continue;

            // Parser CSV simple
            const parts: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                if (line[i] === '"') inQuotes = !inQuotes;
                else if (line[i] === ',' && !inQuotes) {
                    parts.push(current.trim());
                    current = '';
                } else current += line[i];
            }
            parts.push(current.trim());

            if (parts.length < 2 || parts[0] === 'SUIVIE GROUPE') continue;

            const dateStr = parts[0]; // ven. 20 sept. 2024
            const bandName = parts[1];
            const isConfirmed = parts[2]?.toUpperCase() === 'TRUE';
            const paymentMethodRaw = parts[3];
            const recipient = parts[4];
            const amountStr = parts[5]?.replace('€', '').replace('OO', '00').replace(',', '.').replace(' ', '');

            // Parsing Date manuel pour éviter dépendances de locale complexes dans l'action
            // Format: "ven. 20 sept. 2024"
            const dateParts = dateStr.match(/(\d+)\s+([a-zéû\.]+)\s+(\d{4})/i);
            if (!dateParts) continue;

            const day = parseInt(dateParts[1]);
            const monthStr = dateParts[2].toLowerCase().replace('.', '');
            const year = parseInt(dateParts[3]);

            const months: Record<string, number> = {
                'janv': 0, 'févr': 1, 'mars': 2, 'avr': 3, 'mai': 4, 'juin': 5,
                'juil': 6, 'août': 7, 'sept': 8, 'oct': 9, 'nov': 10, 'déc': 11
            };
            const month = months[monthStr] ?? 0;
            const date = new Date(year, month, day, 20, 30);

            // 1. Groupe
            let band = await prisma.musicBand.findUnique({ where: { name: bandName } });
            if (!band) {
                band = await prisma.musicBand.create({
                    data: { name: bandName, genre: 'Live Music' }
                });
                bandCount++;
            }

            // 2. Mapping
            let paymentMethod = "TRANSFER";
            if (paymentMethodRaw?.includes("ESP")) paymentMethod = "CASH";
            if (paymentMethodRaw?.includes("CHE")) paymentMethod = "CHECK";

            // Logique Spécifique du User : GIP = GUSO
            if (recipient?.toUpperCase().includes("GIP") || recipient?.toUpperCase().includes("INTERMITTENT")) {
                paymentMethod = "GUSO";
            }

            let status = isConfirmed ? "SCHEDULED" : "TENTATIVE";
            if (paymentMethodRaw?.includes("Annulé")) status = "CANCELLED";
            if (date < new Date() && status === "SCHEDULED") status = "COMPLETED";

            let invoiceStatus = "PENDING";
            if (recipient?.toUpperCase().includes("PAS DE FACT")) invoiceStatus = "RECEIVED";

            const amount = parseFloat(amountStr) || 0;

            await prisma.musicEvent.create({
                data: {
                    bandId: band.id,
                    date,
                    amount,
                    paymentMethod,
                    status,
                    invoiceStatus,
                    notes: recipient ? `Règlement : ${recipient}` : null,
                    startTime: "20:30"
                }
            });
            eventCount++;
        }

        revalidatePath("/music");
        return { success: true, bandCount, eventCount };
    } catch (e: any) {
        console.error("Import error:", e);
        return { error: e.message };
    }
}
