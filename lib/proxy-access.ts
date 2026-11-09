import { routing } from '@/i18n/routing'
import { BackofficeUserRoles } from '@/lib/types/roles'

/**
 * Règles d'accès appliquées par `proxy.ts` (logique pure, testable).
 *
 * Le proxy est un filet de sécurité de premier niveau : refus par défaut. Tout chemin qui n'est pas
 * explicitement public exige une session, et les sections réservées à l'administration exigent le
 * rôle admin. Il ne remplace pas les gardes des Server Actions, des routes API et des pages.
 */

export type AccessRequirement = 'public' | 'auth' | 'backoffice' | 'admin'

export type AccessDecision =
    | { action: 'allow' }
    | { action: 'sign-in'; locale: string }
    | { action: 'forbidden'; locale: string }

/** Pages accessibles sans session (sans préfixe de locale). */
const PUBLIC_PATHS = new Set([
    '/',
    '/sign-in',
    '/sign-up',
    '/sign-out',
    '/forgot-password',
    '/reset-password',
])

/** Racines des sections réservées aux administrateurs (groupe de routes `(admin)`). */
const ADMIN_ROOTS = ['/boAdmin', '/dataAdministration', '/landing', '/marketplace', '/tools', '/blockchain', '/presale-artworks']
const ADMIN_PREFIX = '/admin-'

/** Racines réservées aux utilisateurs du backoffice (admin, artiste ou responsable de galerie). */
const BACKOFFICE_ROOTS = ['/art']

/** Rôle lu dans la session : seul `admin` ouvre les sections d'administration. */
const ADMIN_ROLE = BackofficeUserRoles.admin
const BACKOFFICE_ROLES: BackofficeUserRoles[] = Object.values(BackofficeUserRoles)

const LOCALE_PATTERN = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`)

/**
 * Normalise un chemin : décode les séquences %xx, réduit les `//`, retire le `/` final.
 * Un chemin illisible (%zz) est conservé tel quel : il ne sera pas reconnu comme public.
 */
function normalize(pathname: string): string {
    let decoded = pathname
    try {
        decoded = decodeURIComponent(pathname)
    } catch {
        // chemin malformé : on garde la forme brute
    }
    const collapsed = decoded.replace(/\/{2,}/g, '/')
    return collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : collapsed
}

/** Sépare la locale (si présente) du reste du chemin : `/fr/dashboard` → `{ locale: 'fr', path: '/dashboard' }`. */
export function splitLocale(pathname: string): { locale: string | null; path: string } {
    const normalized = normalize(pathname)
    const match = normalized.match(LOCALE_PATTERN)
    if (!match) return { locale: null, path: normalized || '/' }
    return { locale: match[1], path: normalized.slice(match[0].length) || '/' }
}

function matchesRoot(lowerPath: string, roots: string[]): boolean {
    return roots.some((root) => {
        const r = root.toLowerCase()
        return lowerPath === r || lowerPath.startsWith(`${r}/`)
    })
}

export function isAdminPath(path: string): boolean {
    const lower = path.toLowerCase()
    return lower.startsWith(ADMIN_PREFIX) || matchesRoot(lower, ADMIN_ROOTS)
}

/** Niveau d'accès requis pour un chemin (locale éventuelle ignorée). */
export function getAccessRequirement(pathname: string): AccessRequirement {
    const { path } = splitLocale(pathname)
    if (isAdminPath(path)) return 'admin'
    if (matchesRoot(path.toLowerCase(), BACKOFFICE_ROOTS)) return 'backoffice'
    if (PUBLIC_PATHS.has(path)) return 'public'
    return 'auth'
}

/**
 * Décide de la suite d'une requête de lecture (GET/HEAD).
 * `role` vient de la session (cookie cache) ; `null` si non authentifié.
 */
export function decideAccess(
    pathname: string,
    session: { role?: string | null } | null
): AccessDecision {
    const requirement = getAccessRequirement(pathname)
    if (requirement === 'public') return { action: 'allow' }

    const locale = splitLocale(pathname).locale ?? routing.defaultLocale
    if (!session) return { action: 'sign-in', locale }

    if (requirement === 'admin' && session.role !== ADMIN_ROLE) {
        return { action: 'forbidden', locale }
    }
    if (requirement === 'backoffice' && !BACKOFFICE_ROLES.includes(session.role as BackofficeUserRoles)) {
        return { action: 'forbidden', locale }
    }
    return { action: 'allow' }
}
