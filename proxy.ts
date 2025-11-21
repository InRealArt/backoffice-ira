import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getRequiredAccessLevel } from './app/config/protectedRoutes'

// Pages publiques qui ne nécessitent pas d'authentification
const publicPaths = ['/', '/api/auth/callback', '/login', '/sign-in', '/sign-up', '/sign-out']

export async function proxy(request: NextRequest) {
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

    // Validation complète de la session avec better-auth
    // Utilisation de auth.api.getSession pour une vérification sécurisée incluant la DB
    if (method === 'GET') {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
        if (!session?.user) {
            return NextResponse.redirect(new URL('/sign-in', request.url))
        }
    }

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
        '/boAdmin/:path*',
        '/dataAdministration/:path*',
        '/blockchain/:path*',
        '/marketplace/:path*',
        '/presale-artworks/:path*',
        '/tools/:path*',
        '/landing/:path*',
    ],
}
