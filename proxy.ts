import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { decideAccess, getAccessRequirement, isAdminPath } from '@/lib/proxy-access'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Créer le middleware i18n
const handleI18nRouting = createIntlMiddleware(routing)

/**
 * Filet de sécurité de premier niveau : refus par défaut (voir lib/proxy-access.ts).
 *
 * - Tout chemin non public (avec ou sans préfixe /fr, /en) exige une session ; les sections
 *   d'administration exigent en plus le rôle admin.
 * - Le contrôle passe AVANT le routage i18n (qui répond toujours) et couvre GET et HEAD.
 * - Les routes /api/* et les POST (Server Actions) ne sont PAS filtrés ici : chaque route et chaque
 *   action se protège elle-même (`npm run check:guards` le vérifie en CI).
 */
export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname
    const method = request.method

    // Ne pas appliquer le middleware aux routes d'API et fichiers statiques
    // (test sur le préfixe : un segment dynamique contenant `_next` ne doit pas échapper au contrôle)
    if (path.startsWith('/api/') ||
        path.startsWith('/_next/') ||
        path === '/favicon.ico') {
        return NextResponse.next()
    }

    if ((method === 'GET' || method === 'HEAD') && getAccessRequirement(path) !== 'public') {
        // Le rôle vient de la session (cookie cache) : pas de requête DB supplémentaire
        const session = await auth.api.getSession({ headers: request.headers })
        const decision = decideAccess(path, session?.user ?? null)

        if (decision.action === 'sign-in') {
            return NextResponse.redirect(new URL(`/${decision.locale}/sign-in`, request.url))
        }
        if (decision.action === 'forbidden') {
            return NextResponse.redirect(new URL(`/${decision.locale}/dashboard`, request.url))
        }
    }

    // Les routes admin ne passent pas par le middleware i18n (pas de préfixe de locale)
    if (!isAdminPath(path)) {
        const i18nResponse = handleI18nRouting(request)
        if (i18nResponse) {
            return i18nResponse
        }
    }

    return NextResponse.next()
}

// Le proxy s'applique à tout sauf aux ressources statiques. On n'exclut PAS « tout chemin contenant un
// point » : un segment dynamique ([id]) peut en contenir et ne doit pas échapper au contrôle.
export const config = {
    matcher: [
        '/((?!_next/|_vercel/|.*\\.(?:ico|png|jpe?g|gif|svg|webp|avif|css|js|map|txt|xml|json|webmanifest|woff2?|ttf|otf|mp4|webm|pdf)$).*)',
    ],
}
