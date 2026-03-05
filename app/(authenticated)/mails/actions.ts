"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getBandProposals() {
    try {
        const proposals = await (prisma as any).musicBandProposal.findMany({
            orderBy: { emailDate: 'desc' },
            where: { status: 'PENDING' }
        });
        return proposals;
    } catch (error) {
        console.error("Failed to fetch band proposals:", error);
        return [];
    }
}

export async function deleteProposal(id: string) {
    try {
        await (prisma as any).musicBandProposal.delete({
            where: { id }
        });
        revalidatePath("/mails");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete proposal:", error);
        return { error: "Erreur lors de la suppression." };
    }
}

export async function acceptProposal(id: string) {
    try {
        const proposal = await (prisma as any).musicBandProposal.findUnique({
            where: { id }
        });

        if (!proposal) return { error: "Proposition introuvable." };

        // Créer le groupe dans la table MusicBand
        // On utilise upsert pour éviter les doublons par nom (unique)
        await prisma.musicBand.upsert({
            where: { name: proposal.bandName },
            update: {
                genre: proposal.style,
                contact: `${proposal.contactName ? proposal.contactName + ' - ' : ''}${proposal.contactEmail || ''} ${proposal.contactPhone || ''}`.trim()
            },
            create: {
                name: proposal.bandName,
                genre: proposal.style,
                contact: `${proposal.contactName ? proposal.contactName + ' - ' : ''}${proposal.contactEmail || ''} ${proposal.contactPhone || ''}`.trim()
            }
        });

        // Marquer comme acceptée (ou supprimer ?)
        // Le user a dit "base de données pour que je puisse voir toutes les propositions"
        // Mais "accepter" impliquerait de le passer en groupe réel.
        // Je vais le marquer comme ACCEPTED pour qu'il disparaisse du flux PENDING mais reste en DB.
        await (prisma as any).musicBandProposal.update({
            where: { id },
            data: { status: 'ACCEPTED' }
        });

        revalidatePath("/mails");
        revalidatePath("/music");
        return { success: true };
    } catch (error) {
        console.error("Failed to accept proposal:", error);
        return { error: "Erreur lors de l'acceptation." };
    }
}

export async function triggerHistoricalScan() {
    // 1. Chercher l'URL dans le .env ou tenter l'URL réseau interne Easypanel
    // Dans Easypanel, si le service s'appelle 'restaurant-os-bot', 
    // il est accessible en interne via http://restaurant-os-bot:5000
    const webhookUrl = process.env.GMAIL_SYNC_WEBHOOK_URL || "http://restaurant-os-bot:5000/webhook";
    const apiKey = process.env.RESTAURANT_OS_API_KEY || process.env.N8N_API_KEY;

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey || ''
            },
            body: JSON.stringify({ action: 'sync' }),
            // Timeout court pour le test interne
            signal: AbortSignal.timeout(5000)
        });

        const data = await response.json();
        if (data.success) {
            return { success: true, message: data.message || "La synchronisation a été lancée. Les données apparaîtront d'ici quelques minutes." };
        } else {
            return { error: data.error || "Le robot de synchronisation a retourné une erreur." };
        }
    } catch (error) {
        console.error("Failed to trigger Gmail sync:", error);

        if (!process.env.GMAIL_SYNC_WEBHOOK_URL) {
            return { error: "Le robot n'est pas détecté. Assurez-vous que le service 'restaurant-os-bot' est bien lancé sur Easypanel ou configurez GMAIL_SYNC_WEBHOOK_URL." };
        }

        return { error: "Impossible de contacter le robot de synchronisation. Vérifiez l'URL dans votre .env." };
    }
}

