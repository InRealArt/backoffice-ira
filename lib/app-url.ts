// URL de base de l'application côté navigateur.
// En prévisualisation Vercel, NEXT_PUBLIC_APP_URL (celle de la production) ne doit pas être utilisée :
// les requêtes d'authentification doivent rester sur le domaine de la preview, sinon le cookie de
// session ne suit pas. NEXT_PUBLIC_VERCEL_ENV est exposée par Vercel (variables système).
export function getClientBaseUrl(): string {
    const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
    if (!isPreview && process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
    return typeof window !== 'undefined' ? window.location.origin : ''
}
