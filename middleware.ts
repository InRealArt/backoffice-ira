import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getRequiredAccessLevel } from './app/config/protectedRoutes'

// Pages publiques qui ne nécessitent pas d'authentification
const publicPaths = ['/', '/api/auth/callback', '/login']

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Ne pas appliquer la protection aux chemins publics ou aux routes d'API
    if (publicPaths.some(p => path === p) ||
        path.startsWith('/api/') ||
        path.includes('/_next/') ||
        path.includes('/favicon.ico')) {
        return NextResponse.next()
    }

    // Récupérer le niveau d'accès requis pour ce chemin
    const requiredAccess = getRequiredAccessLevel(path)
    console.log("requiredAccess", requiredAccess)

    // Si aucun accès requis, autoriser l'accès
    if (!requiredAccess) {
        return NextResponse.next()
    }

    // Récupérer le cookie d'authentification Dynamic
    const authToken = request.cookies.get('dynamic_auth_token')?.value
    console.log("authToken", authToken)
    // Si accès authentifié requis mais pas de token, rediriger vers l'accueil
    if (requiredAccess && !authToken) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // Pour les vérifications de rôles spécifiques (admin, artist), 
    // nous les laissons aux layouts qui ont accès au contexte Dynamic
    return NextResponse.next()
}

// Configurer les chemins sur lesquels le middleware s'applique
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
} 