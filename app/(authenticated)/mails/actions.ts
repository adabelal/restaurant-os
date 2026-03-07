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

export async function updateProposalStyle(id: string, newStyle: string) {
    try {
        await (prisma as any).musicBandProposal.update({
            where: { id },
            data: { style: newStyle }
        });
        revalidatePath("/mails");
        return { success: true };
    } catch (error) {
        console.error("Failed to update proposal style:", error);
        return { error: "Erreur lors de la mise à jour du style." };
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
                email: proposal.contactEmail,
                phone: proposal.contactPhone,
                contact: proposal.contactName,
                description: proposal.fullDescription
            },
            create: {
                name: proposal.bandName,
                genre: proposal.style,
                email: proposal.contactEmail,
                phone: proposal.contactPhone,
                contact: proposal.contactName,
                description: proposal.fullDescription
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
    // 1. Définir les URLs à tester (interne Easypanel)
    const internalHostnames = [
        "mail-automation",
        "restaurant-os-bot",
        "restaurant-os-mail-bot",
        "mail-bot",
        "mail",
        "bot"
    ];
    let webhookUrl = process.env.GMAIL_SYNC_WEBHOOK_URL;
    const apiKey = process.env.RESTAURANT_OS_API_KEY || process.env.N8N_API_KEY;

    // Si pas d'URL forcée dans le .env, on essaiera les noms internes
    const urlsToTry = webhookUrl ? [webhookUrl] : internalHostnames.map(h => `http://${h}:5000/webhook`);

    let lastError = null;
    let attemptedUrls: string[] = [];

    for (const url of urlsToTry) {
        try {
            attemptedUrls.push(url);
            console.log(`Tentative de synchro via : ${url}`);

            // On utilise une approche compatible avec les versions de Node qui n'ont pas encore AbortSignal.timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey || ''
                },
                body: JSON.stringify({ action: 'sync' }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                lastError = `Erreur HTTP ${response.status}`;
                continue;
            }

            const data = await response.json();
            if (data.success) {
                return { success: true, message: data.message || "La synchronisation a été lancée." };
            }
            lastError = data.error || "Réponse invalide du robot.";
        } catch (error: any) {
            console.warn(`Echec test URL ${url}:`, error.message);
            lastError = error.message;
        }
    }

    // Si on arrive ici, aucun test n'a fonctionné
    return {
        error: `Le robot n'est pas détecté. Vérifiez le nom du service sur Easypanel. ` +
            `(Détail: ${lastError.includes('AbortError') ? "Délai dépassé (3s)" : lastError}. URLs testées: ${attemptedUrls.join(', ')})`
    };
}

export async function cleanupPopinaData() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log("🚀 Starting cleanup of Caisse data created today...");

        // 1. Supprimer les transactions de caisse qui contiennent "Popina" créées aujourd'hui
        const deletedTransactions = await prisma.cashTransaction.deleteMany({
            where: {
                createdAt: { gte: today },
                description: { contains: "Popina" }
            }
        });

        // 2. Supprimer les logs de mails traités correspondants
        const deletedMails = await (prisma as any).processedMail.deleteMany({
            where: {
                date: { gte: today },
                type: "POPINA_REPORT"
            }
        });

        revalidatePath("/mails");
        revalidatePath("/caisse");

        return {
            success: true,
            message: `${deletedTransactions.count} transactions et ${deletedMails.count} logs de mails ont été supprimés.`
        };
    } catch (error: any) {
        console.error("Cleanup error:", error);
        return { error: "Erreur lors du nettoyage : " + error.message };
    }
}
