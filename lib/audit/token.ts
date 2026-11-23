import { createHash, randomBytes } from 'crypto'

/** Jeton secret : 32 octets aléatoires encodés en base64url (43 caractères). Jamais dérivé d'une donnée client. */
export function generateAuditToken(): string {
    return randomBytes(32).toString('base64url')
}

/** Seul le SHA-256 du jeton est conservé en base (entropie suffisante, pas de sel nécessaire). */
export function hashAuditToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
}

/** Lien privé transmis au client. */
export function buildAuditUrl(token: string): string {
    const base = (process.env.LANDING_PUBLIC_URL || 'https://inrealart.com').replace(/\/+$/, '')
    return `${base}/audit/${token}`
}

/** Expiration par défaut : échéance + 30 jours. */
export const DEFAULT_EXPIRY_DAYS_AFTER_DUE = 30

export function defaultExpiresAt(dueDate: Date): Date {
    const d = new Date(dueDate)
    d.setUTCDate(d.getUTCDate() + DEFAULT_EXPIRY_DAYS_AFTER_DUE)
    return d
}
