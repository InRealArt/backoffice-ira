/** Version du questionnaire affiché côté admin ; doit rester identique à celle de la landing. */
export const QUESTIONNAIRE_VERSION = 1

export const PAYMENT_TYPE_LABELS = {
    DEPOSIT: 'Acompte',
    FULL: 'Totalité',
} as const

export const STATUS_LABELS = {
    OPEN: 'Non commencé',
    DRAFT: 'Brouillon',
    SUBMITTED: 'Soumis',
} as const

export const FILE_KIND_LABELS = {
    CV_PORTFOLIO: 'CV / portfolio',
    REVENUE_DECLARATIONS: 'Déclarations de revenus',
    GALLERY_CONTRACTS: 'Contrats de galerie',
    INVENTORY: 'Inventaire',
    PRICE_LIST: 'Liste de prix',
    RETIREMENT_STATEMENT: 'Relevé de retraite',
} as const

export type AuditLinkState = 'active' | 'expired' | 'revoked'

export function getLinkState(audit: { revokedAt: Date | null; expiresAt: Date }, now = new Date()): AuditLinkState {
    if (audit.revokedAt) return 'revoked'
    if (audit.expiresAt.getTime() < now.getTime()) return 'expired'
    return 'active'
}

export function formatDate(date: Date | null | undefined): string {
    return date ? new Date(date).toLocaleDateString('fr-FR') : '-'
}

export function toDateInputValue(date: Date): string {
    return new Date(date).toISOString().slice(0, 10)
}
