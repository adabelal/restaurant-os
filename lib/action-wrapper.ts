import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

/**
 * Wrapper de sécurité pour les Server Actions
 * Vérifie l'authentification et le rôle (optionnel) AVANT d'exécuter l'action.
 * @param action L'action métier (async) à exécuter
 * @param allowedRoles Liste des rôles autorisés (ex: ['ADMIN', 'MANAGER'])
 */
export async function withAuth<T>(
    action: (session: any) => Promise<T>,
    allowedRoles?: string[]
): Promise<T | { success: false, error: string }> {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        return { success: false, error: "Non authentifié. Veuillez vous connecter." }
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role as string)) {
        return { success: false, error: "Accès refusé. Rôle insuffisant." }
    }

    try {
        return await action(session)
    } catch (error) {
        console.error("Action Wrapper Error:", error)
        return { success: false, error: "Une erreur inattendue est survenue." }
    }
}
