import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

/**
 * Vérifie que l'utilisateur est authentifié
 * À utiliser dans les Server Actions
 */
export async function requireAuth() {
    const session = await auth()

    if (!session?.user) {
        throw new Error("Non autorisé")
    }

    return session
}

/**
 * Vérifie que l'utilisateur est authentifié et redirige sinon
 * À utiliser dans les pages serveur
 */
export async function requireAuthOrRedirect() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    return session
}

/**
 * Récupère l'utilisateur courant (peut être null)
 */
export async function getCurrentUser() {
    const session = await auth()
    return session?.user ?? null
}

/**
 * Type pour les réponses d'actions sécurisées
 */
export type ActionResult<T = void> =
    | { success: true; data?: T }
    | { success: false; error: string }
