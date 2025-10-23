import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getRequiredAccessLevel } from './app/config/protectedRoutes'

// Pages publiques qui ne nécessitent pas d'authentification
const publicPaths = ['/', '/api/auth/callback', '/login']

export default function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Ne pas appliquer la protection aux chemins publics ou aux routes d'API
    if (publicPaths.some(p => path === p) ||
        path.startsWith('/api/') ||
        path.includes('/_next/') ||
        path.includes('/favicon.ico')) {
        return NextResponse.next()
    }

    // Récupérer le niveau d'accès requis pour ce chemin
    const requiredAccessLevel = getRequiredAccessLevel(path)
    //console.log("requiredAccess", requiredAccessLevel)

    // Si aucun accès requis, autoriser l'accès
    if (!requiredAccessLevel) {
        return NextResponse.next()
    }

    // Vérifier si l'utilisateur est connecté via le cookie
    const authToken = request.cookies.get('dynamic_auth_token')
    const isLoggedIn = !!authToken

    // Si l'utilisateur n'est pas connecté, rediriger vers la page d'accueil
    if (!isLoggedIn) {
        const url = new URL('/', request.url)
        return NextResponse.redirect(url)
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
