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
