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
                    take: 5,
                },
            },
        })

        // Sérialisation des types Decimal pour React
        return bands.map(band => ({
            ...band,
            events: band.events.map(event => ({
                ...event,
                amount: Number(event.amount)
            }))
        }))
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

        // Sérialisation des types Decimal pour React
        return events.map(event => ({
            ...event,
            amount: Number(event.amount)
        }))
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
 * IMPORTATION DEPUIS CSV (VERSION 2) - CORRECTIF ROBUSTE
 * Gère les dates, les montants complexes et les règlements GIP/Asso.
 */
export async function importMusicDataV2(csvContent: string) {
    try {
        console.log("--- Initialisation de la synchronisation v2 ---");

        // 1. Nettoyage sécurisé
        await prisma.musicEvent.deleteMany();
        await prisma.musicBand.deleteMany();

        // Détection automatique du délimiteur (virgule ou point-virgule)
        const delimiter = csvContent.includes(';') ? ';' : ',';
        const lines = csvContent.split('\n');
        const dataLines = lines.slice(1);

        let bandCount = 0;
        let eventCount = 0;
        let skippedLines = 0;

        for (const line of dataLines) {
            if (!line.trim() || line.startsWith(delimiter + delimiter)) {
                skippedLines++;
                continue;
            }

            // Parser CSV (gestion des guillemets et du délimiteur dynamique)
            const parts: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                if (line[i] === '"') inQuotes = !inQuotes;
                else if (line[i] === delimiter && !inQuotes) {
                    parts.push(current.trim());
                    current = '';
                } else current += line[i];
            }
            parts.push(current.trim());

            if (parts.length < 2 || !parts[0] || parts[0].includes('SUIVIE GROUPE')) {
                skippedLines++;
                continue;
            }

            const dateStr = parts[0];
            const bandName = parts[1];
            const isConfirmed = parts[2]?.toUpperCase() === 'TRUE';
            const paymentMethodRaw = parts[3] || "";
            const recipient = parts[4] || "";
            const amountStr = (parts[6] || parts[5] || "0").replace('€', '').replace('OO', '00').replace(',', '.').replace(/\s/g, '');

            // Parsing Date robuste (ex: "ven. 20 sept. 2024")
            const dateMatch = dateStr.match(/(\d+)\s+([a-zéû]+)\.?\s+(\d{4})/i);
            if (!dateMatch) {
                skippedLines++;
                continue;
            }

            const day = parseInt(dateMatch[1]);
            const monthRaw = dateMatch[2].toLowerCase();
            const year = parseInt(dateMatch[3]);

            const months: Record<string, number> = {
                'janv': 0, 'janvier': 0,
                'f': 1, 'févr': 1, 'février': 1, // 'f' catch-all for fév
                'mar': 2, 'mars': 2,
                'avr': 3, 'avril': 3,
                'mai': 4,
                'juin': 5,
                'juil': 6, 'juillet': 6,
                'août': 7,
                'sep': 8, 'sept': 8, 'septembre': 8,
                'oct': 9, 'octobre': 9,
                'nov': 10, 'novembre': 10,
                'déc': 11, 'décembre': 11
            };

            const monthKey = Object.keys(months).find(k => monthRaw.startsWith(k)) || 'janv';
            const month = months[monthKey];
            const date = new Date(year, month, day, 20, 30);

            if (isNaN(date.getTime())) {
                skippedLines++;
                continue;
            }

            // 1. Groupe - Normalisation du nom (trim et recherche insensible à la casse)
            const normalizedBandName = bandName.trim();
            let band = await prisma.musicBand.findFirst({
                where: {
                    name: {
                        equals: normalizedBandName,
                        mode: 'insensitive'
                    }
                }
            });

            if (!band) {
                band = await prisma.musicBand.create({
                    data: { name: normalizedBandName, genre: 'Live Music' }
                });
                bandCount++;
            }

            // 2. Mapping Paiement
            let paymentMethod = "TRANSFER";
            if (paymentMethodRaw.toUpperCase().includes("ESP")) paymentMethod = "CASH";
            if (paymentMethodRaw.toUpperCase().includes("CHE")) paymentMethod = "CHECK";

            if (recipient.toUpperCase().includes("GIP") || recipient.toUpperCase().includes("INTERMITTENT")) {
                paymentMethod = "GUSO";
            }

            let status = isConfirmed ? "SCHEDULED" : "TENTATIVE";
            if (paymentMethodRaw.toUpperCase().includes("ANNUL")) status = "CANCELLED";
            else if (date < new Date() && isConfirmed) status = "COMPLETED";

            let invoiceStatus = "PENDING";
            if (recipient.toUpperCase().includes("PAS DE FACT") || recipient.toUpperCase().includes("NON REQUIS")) {
                invoiceStatus = "RECEIVED";
            } else if (status === "COMPLETED" && paymentMethod === "CASH") {
                invoiceStatus = "PAID";
            }

            const amount = parseFloat(amountStr) || 0;

            await prisma.musicEvent.create({
                data: {
                    bandId: band.id,
                    date,
                    amount,
                    paymentMethod,
                    status,
                    invoiceStatus,
                    notes: recipient ? `Destinataire : ${recipient}` : null,
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

