import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getRequiredAccessLevel } from './app/config/protectedRoutes'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Créer le middleware i18n
const handleI18nRouting = createIntlMiddleware(routing)

// Pages publiques qui ne nécessitent pas d'authentification
// Inclure les chemins avec et sans locale
const publicPaths = ['/', '/api/auth/callback', '/login', '/sign-in', '/sign-up', '/sign-out', '/fr', '/en', '/fr/sign-in', '/en/sign-in', '/fr/sign-up', '/en/sign-up', '/fr/sign-out', '/en/sign-out', '/fr/forgot-password', '/en/forgot-password', '/fr/reset-password', '/en/reset-password']

export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname
    const method = request.method

    // Ne pas appliquer le middleware aux routes d'API et fichiers statiques
    if (path.startsWith('/api/') ||
        path.includes('/_next/') ||
        path.includes('/favicon.ico')) {
        return NextResponse.next()
    }

    // Exclure les routes admin du middleware i18n
    const isAdminRoute = path.startsWith('/admin-') ||
        path.startsWith('/blockchain') ||
        path.startsWith('/boAdmin') ||
        path.startsWith('/dataAdministration') ||
        path.startsWith('/landing') ||
        path.startsWith('/marketplace') ||
        path.startsWith('/tools')

    // Appliquer le middleware i18n pour les routes non-admin
    if (!isAdminRoute) {
        const i18nResponse = handleI18nRouting(request)
        if (i18nResponse) {
            return i18nResponse
        }
    }

    // Ne pas appliquer la protection d'authentification aux chemins publics
    if (publicPaths.some(p => path === p)) {
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
            // Extraire la locale depuis le path si elle existe
            const localeMatch = path.match(/^\/(fr|en)/)
            const locale = localeMatch ? localeMatch[1] : 'fr'
            return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url))
        }
    }

    return NextResponse.next()
}

// Configurer les chemins sur lesquels le proxy s'applique
export const config = {
    matcher: [
        // Matcher pour toutes les routes sauf les fichiers statiques et les routes API
        '/((?!api|_next|_vercel|.*\\..*).*)',
        // Routes protégées spécifiques
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
