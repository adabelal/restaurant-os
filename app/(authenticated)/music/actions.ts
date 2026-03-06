"use server"

import { cache } from "react"
import { safeAction } from "@/lib/safe-action"

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
    id: z.string().optional(),
    bandId: z.string().min(1, "Le groupe est requis"),
    date: z.string().min(1, "La date est requise"),
    startTime: z.string().optional(),
    amount: z.coerce.number().min(0, "Le montant doit être positif"),
    isFree: z.boolean().default(false),
    paymentMethod: z.string().min(1, "Le mode de paiement est requis"),
    invoiceStatus: z.string().min(1, "Le statut de facture est requis"),
    status: z.string().default("SCHEDULED"),
    notes: z.string().optional(),
})

const BandProfileSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Le nom est requis"),
    genre: z.string().optional(),
    contact: z.string().optional(),
    email: z.string().email("Email invalide").or(z.literal("")).optional(),
    phone: z.string().optional(),
    description: z.string().optional(),
})

export async function createBand(formData: FormData) {
    return safeAction(
        formData,
        async (input, context) => {
            const rawData = {
                name: input.get("name"),
                genre: input.get("genre"),
                contact: input.get("contact"),
            }

            const result = BandSchema.safeParse(rawData)

            if (!result.success) {
                return { error: result.error.flatten().fieldErrors }
            }

            try {
                await prisma.musicBand.create({
                    data: {
                        name: result.data.name as string,
                        genre: result.data.genre as string | undefined,
                        contact: result.data.contact as string | undefined,
                    },
                })
                revalidatePath("/music")
                return { success: true }
            } catch (error) {
                console.error("Failed to create band:", error)
                return { error: "Failed to create band" }
            }
        }
    )
}

export async function updateBandProfile(formData: FormData) {
    return safeAction(
        formData,
        async (input, context) => {
            const rawData = {
                id: input.get("id"),
                name: input.get("name"),
                genre: input.get("genre"),
                email: input.get("email"),
                phone: input.get("phone"),
                description: input.get("description"),
            }

            const result = BandProfileSchema.safeParse(rawData)

            if (!result.success) {
                return { error: result.error.flatten().fieldErrors }
            }

            try {
                // Workaround pour être sûr que le type est pris en compte après ajout DB direct
                await (prisma.musicBand as any).update({
                    where: { id: result.data.id },
                    data: {
                        name: result.data.name,
                        genre: result.data.genre,
                        email: result.data.email,
                        phone: result.data.phone,
                        description: result.data.description,
                    },
                })
                revalidatePath("/music")
                revalidatePath(`/music/bands/${result.data.id}`)
                return { success: true }
            } catch (error) {
                console.error("Failed to update band details:", error)
                return { error: "Erreur lors de la mise à jour des infos du groupe" }
            }
        }
    )
}

export async function createEvent(formData: FormData) {
    return safeAction(
        formData,
        async (input, context) => {
            const rawData = {
                bandId: input.get("bandId"),
                date: input.get("date"),
                startTime: input.get("startTime"),
                amount: input.get("amount"),
                isFree: input.get("isFree") === "true",
                paymentMethod: input.get("paymentMethod"),
                invoiceStatus: input.get("invoiceStatus"),
                status: input.get("status") || "SCHEDULED",
                notes: input.get("notes"),
            }

            const result = EventSchema.safeParse(rawData)

            if (!result.success) {
                return { error: result.error.flatten().fieldErrors }
            }

            try {
                // Pour ESP, on force PAID d'office
                const isCash = result.data.paymentMethod === "CASH"
                const finalInvoiceStatus = isCash ? "PAID" : result.data.invoiceStatus

                const event = await (prisma.musicEvent as any).create({
                    data: {
                        bandId: result.data.bandId,
                        date: new Date(result.data.date),
                        startTime: result.data.startTime,
                        amount: result.data.isFree ? 0 : result.data.amount,
                        isFree: result.data.isFree,
                        paymentMethod: result.data.paymentMethod || "TBD",
                        invoiceStatus: finalInvoiceStatus,
                        status: result.data.status,
                        notes: result.data.notes,
                    },
                    include: { band: true }
                })

                // Automatisation Caisse si CASH et COMPLETED et montant > 0
                const amountValue = Number(event.amount)
                if (event.status === "COMPLETED" && isCash && !event.isFree && amountValue > 0) {
                    await handleMusicCashTransaction(event)
                }

                revalidatePath("/music")
                return { success: true }
            } catch (error) {
                console.error("Failed to create event:", error)
                return { error: "Failed to create event" }
            }
        }
    )
}

/**
 * Met à jour un concert existant
 */
export async function updateEvent(formData: FormData) {
    return safeAction(
        formData,
        async (input, context) => {
            const id = input.get("id") as string
            if (!id) return { error: "ID manquant" }

            const rawData = {
                bandId: input.get("bandId"),
                date: input.get("date"),
                startTime: input.get("startTime"),
                amount: input.get("amount"),
                isFree: input.get("isFree") === "true",
                paymentMethod: input.get("paymentMethod"),
                invoiceStatus: input.get("invoiceStatus"),
                status: input.get("status"),
                notes: input.get("notes"),
            }

            const result = EventSchema.safeParse(rawData)
            if (!result.success) {
                return { error: result.error.flatten().fieldErrors }
            }

            try {
                const oldEvent = await prisma.musicEvent.findUnique({ where: { id } })

                // Pour ESP, on force PAID d'office
                const isCash = result.data.paymentMethod === "CASH"
                const finalInvoiceStatus = isCash ? "PAID" : result.data.invoiceStatus

                const event = await (prisma.musicEvent as any).update({
                    where: { id },
                    data: {
                        bandId: result.data.bandId,
                        date: new Date(result.data.date),
                        startTime: result.data.startTime,
                        amount: result.data.isFree ? 0 : result.data.amount,
                        isFree: result.data.isFree,
                        paymentMethod: result.data.paymentMethod || "TBD",
                        invoiceStatus: finalInvoiceStatus,
                        status: result.data.status,
                        notes: result.data.notes,
                    },
                    include: { band: true }
                })

                // Automatisation Caisse : Logique Robuste
                const isCompleted = event.status === "COMPLETED"
                const amountValue = Number(event.amount)

                if (isCompleted && isCash && !event.isFree && amountValue > 0) {
                    await handleMusicCashTransaction(event)
                } else {
                    // Si on n'est plus en CASH/COMPLETED/MONTANT, on supprime la transaction de caisse liée si elle existe
                    await removeMusicCashTransaction(event.id)
                }

                revalidatePath("/music")
                revalidatePath("/caisse")
                return { success: true }
            } catch (error) {
                console.error("Failed to update event:", error)
                return { error: "Erreur lors de la mise à jour" }
            }
        }
    )
}

/**
 * Helper pour créer une transaction de caisse pour un concert
 */
async function handleMusicCashTransaction(event: any) {
    try {
        const tag = `[MUSIQUE_REF:${event.id}]`
        const description = `Paiement ESP - Concert ${event.band.name} ${tag}`

        // Chercher ou créer la catégorie "Animations"
        let category = await prisma.financeCategory.findFirst({
            where: { name: "Animations", type: "VARIABLE_COST" }
        })

        if (!category) {
            category = await prisma.financeCategory.create({
                data: {
                    name: "Animations",
                    type: "VARIABLE_COST",
                    color: "purple",
                    description: "Frais liés aux concerts et animations"
                }
            })
        }

        // Vérifier si une transaction existe déjà pour ce concert
        const existing = await prisma.cashTransaction.findFirst({
            where: { description: { contains: tag } }
        })

        const amount = -Math.abs(Number(event.amount))

        if (existing) {
            // Mise à jour si le montant ou la date a changé
            await prisma.cashTransaction.update({
                where: { id: existing.id },
                data: {
                    amount,
                    date: event.date,
                    description,
                    categoryId: category.id
                }
            })
            console.log(`[Caisse] Transaction mise à jour pour ${event.band.name}`)
        } else {
            // Création si nouvelle
            await prisma.cashTransaction.create({
                data: {
                    date: event.date,
                    amount,
                    type: "OUT",
                    description,
                    categoryId: category.id
                }
            })
            console.log(`[Caisse] Nouvelle transaction créée pour ${event.band.name}`)
        }
    } catch (e) {
        console.error("Error handling music cash transaction:", e)
    }
}

/**
 * Supprime une transaction de caisse liée à un concert
 */
async function removeMusicCashTransaction(eventId: string) {
    try {
        const tag = `[MUSIQUE_REF:${eventId}]`
        const transactions = await prisma.cashTransaction.findMany({
            where: { description: { contains: tag } }
        })

        for (const tx of transactions) {
            await prisma.cashTransaction.delete({ where: { id: tx.id } })
        }
    } catch (e) {
        console.error("Error removing music cash transaction:", e)
    }
}

export const getBands = cache(async () => {
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
});

export const getEvents = cache(async () => {
    try {
        const events = await prisma.musicEvent.findMany({
            orderBy: { date: "desc" },
            include: {
                band: true,
            },
        })

        // Sérialisation et Statut Automatique
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        return events.map(event => {
            let status = event.status
            const eventDate = new Date(event.date)

            // Si la date est passée et que ce n'est pas annulé, c'est COMPLETED d'office
            if (eventDate < now && status !== "CANCELLED" && status !== "TENTATIVE") {
                status = "COMPLETED"
            }

            return {
                ...event,
                amount: Number(event.amount),
                status
            }
        })
    } catch (error) {
        console.error("Failed to fetch events:", error)
        return []
    }
});

export async function updateEventStatus(eventId: string, status: string, invoiceStatus?: string) {
    return safeAction(
        { eventId, status, invoiceStatus },
        async (input, context) => {
            try {
                await prisma.musicEvent.update({
                    where: { id: input.eventId },
                    data: {
                        status: input.status,
                        ...(input.invoiceStatus && { invoiceStatus: input.invoiceStatus })
                    }
                })
                revalidatePath("/music")
                return { success: true }
            } catch (error) {
                console.error("Failed to update event:", error)
                return { error: "Failed to update event" }
            }
        }
    )
}

export async function linkInvoiceToEvent(eventId: string, invoiceUrl: string) {
    return safeAction({ eventId, invoiceUrl }, async (input) => {
        try {
            await (prisma.musicEvent as any).update({
                where: { id: input.eventId },
                data: {
                    invoiceUrl: input.invoiceUrl,
                    invoiceStatus: "RECEIVED" // On marque automatiquement comme reçu
                }
            })
            revalidatePath("/music")
            return { success: true }
        } catch (error) {
            console.error("Failed to link invoice to event:", error)
            return { error: "Erreur lors de la liaison de la facture" }
        }
    })
}

/**
 * IMPORTATION DEPUIS CSV (VERSION 2) - CORRECTIF ROBUSTE
 * Gère les dates, les montants complexes et les règlements GIP/Asso.
 */
export async function importMusicDataV2(csvContent: string) {
    return safeAction(
        csvContent,
        async (input, context) => {
            try {
                console.log("--- Initialisation de la synchronisation v2 ---");

                // 1. Nettoyage sécurisé
                await prisma.musicEvent.deleteMany();
                await prisma.musicBand.deleteMany();

                // Détection automatique du délimiteur (virgule ou point-virgule)
                const delimiter = input.includes(';') ? ';' : ',';
                const lines = input.split('\n');
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
    )
}

export async function deleteEvent(eventId: string) {
    return safeAction(eventId, async (id) => {
        try {
            await removeMusicCashTransaction(id)
            await prisma.musicEvent.delete({ where: { id } })
            revalidatePath("/music")
            revalidatePath("/caisse")
            return { success: true }
        } catch (error) {
            console.error("Failed to delete event:", error)
            return { error: "Failed to delete event" }
        }
    })
}

export async function deleteBand(bandId: string) {
    return safeAction(bandId, async (id) => {
        try {
            // First check if band has events
            const events = await prisma.musicEvent.count({ where: { bandId: id } })
            if (events > 0) {
                return { error: "Veuillez d'abord supprimer les concerts de ce groupe." }
            }

            await prisma.musicBand.delete({ where: { id } })
            revalidatePath("/music")
            return { success: true }
        } catch (error) {
            console.error("Failed to delete band:", error)
            return { error: "Erreur lors de la suppression." }
        }
    })
}

/**
 * Simule l'envoi d'un mail de relance pour une facture
 */
export async function sendInvoiceReminder(eventId: string) {
    return safeAction(eventId, async (id) => {
        try {
            const event = await prisma.musicEvent.findUnique({
                where: { id },
                include: { band: true }
            })

            if (!event || !event.band) return { error: "Concert non trouvé" }

            // Logique simulée d'envoi de mail
            console.log(`[MAIL] Envoi relance à ${event.band.name} pour le concert du ${event.date.toLocaleDateString()}`)

            // Dans une vraie app, on utiliserait un transporteur mail ici
            // await sendEmail({ to: event.band.contact, subject: "Relance Facture...", ... })

            return { success: true, message: `Mail de relance envoyé à ${event.band.name}` }
        } catch (e) {
            return { error: "Erreur lors de l'envoi du mail" }
        }
    })
}
