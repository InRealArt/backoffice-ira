import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getRequiredAccessLevel } from './app/config/protectedRoutes'
import { getSessionCookie } from 'better-auth/cookies'

// Pages publiques qui ne nécessitent pas d'authentification
const publicPaths = ['/', '/api/auth/callback', '/login', '/sign-in', '/sign-up', '/sign-out']

export default function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname
    const method = request.method

    // Ne pas appliquer la protection aux chemins publics ou aux routes d'API
    if (publicPaths.some(p => path === p) ||
        path.startsWith('/api/') ||
        path.includes('/_next/') ||
        path.includes('/favicon.ico')) {
        return NextResponse.next()
    }

    // Ignorer les requêtes POST (Server Actions, RSC requests de Next.js)
    // Ces requêtes sont des appels internes de Next.js et ne doivent pas être interceptées
    if (method === 'POST') {
        return NextResponse.next()
    }

    // Ignorer les requêtes HEAD (health checks, etc.)
    if (method === 'HEAD') {
        return NextResponse.next()
    }

    // Récupérer le niveau d'accès requis pour ce chemin
    const requiredAccessLevel = getRequiredAccessLevel(path)

    // Si aucun accès requis, autoriser l'accès
    if (!requiredAccessLevel) {
        return NextResponse.next()
    }

    // Vérifier si l'utilisateur est connecté via le cookie Better-Auth
    // Note: Ceci est une vérification optimiste basée sur la présence du cookie
    // La validation complète de la session sera effectuée côté serveur/page
    // Seulement pour les requêtes GET (navigations utilisateur)
    if (method === 'GET') {
        const sessionCookie = getSessionCookie(request)
        const isLoggedIn = !!sessionCookie

        // Si l'utilisateur n'est pas connecté, rediriger vers la page d'accueil
        if (!isLoggedIn) {
            const url = new URL('/', request.url)
            return NextResponse.redirect(url)
        }
    }

    // Nous ne pouvons pas vérifier l'email dans le proxy car 
    // nous n'avons pas accès aux informations de l'utilisateur
    // La vérification d'autorisation sera gérée par le composant AuthObserver
    // et la page elle-même

    return NextResponse.next()
}

// Configurer les chemins sur lesquels le proxy s'applique
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/art/:path*',
        '/profile/:path*',
        '/notifications/:path*',
    ],
}
