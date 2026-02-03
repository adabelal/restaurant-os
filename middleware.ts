import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ["/login"]

// Routes API publiques
const publicApiRoutes = ["/api/auth"]

export async function middleware(req: NextRequest) {
    const { nextUrl } = req
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const isLoggedIn = !!token

    const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
    const isPublicApiRoute = publicApiRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
    )
    const isApiRoute = nextUrl.pathname.startsWith("/api")

    // Permettre les routes API publiques
    if (isPublicApiRoute) {
        return NextResponse.next()
    }

    // Protéger les routes API privées
    if (isApiRoute && !isLoggedIn) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Rediriger vers login si non connecté sur une route protégée
    if (!isLoggedIn && !isPublicRoute) {
        const loginUrl = new URL("/login", nextUrl.origin)
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Rediriger vers dashboard si déjà connecté et sur la page login
    if (isLoggedIn && isPublicRoute) {
        return NextResponse.redirect(new URL("/", nextUrl.origin))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // Exclure les fichiers statiques et les assets
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
