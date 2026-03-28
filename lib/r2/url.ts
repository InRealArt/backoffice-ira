/**
 * URL de base pour le stockage R2 public.
 * Centralisée ici pour faciliter les changements de provider cloud.
 */
const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ''

/**
 * Custom domain Cloudflare alias pour R2.
 * Utilisé pour la rétrocompatibilité avec les URLs legacy.
 */
const R2_CUSTOM_DOMAIN = 'https://images.inrealart.com'

/**
 * Bucket Firebase Storage (ancien système).
 * URL de base pour la rétrocompatibilité.
 */
const FIREBASE_STORAGE_BASE = 'https://firebasestorage.googleapis.com/v0/b/'

/**
 * Extrait le chemin relatif du bucket depuis n'importe quelle URL de stockage.
 * Gère Firebase Storage, R2 public URL, et R2 custom domain.
 * Si l'entrée est déjà un chemin relatif, le retourne tel quel.
 *
 * @example
 * toRelativePath('https://firebasestorage.googleapis.com/v0/b/bucket/o/backoffice%2Fartists%2Ffoo.webp?alt=media&token=xxx')
 * // => 'backoffice/artists/foo.webp'
 *
 * toRelativePath('https://pub-xxx.r2.dev/artists/Jean Dupont/profile.webp')
 * // => 'artists/Jean Dupont/profile.webp'
 *
 * toRelativePath('https://images.inrealart.com/artists/Jean Dupont/profile.webp')
 * // => 'artists/Jean Dupont/profile.webp'
 *
 * toRelativePath('artists/Jean Dupont/profile.webp')
 * // => 'artists/Jean Dupont/profile.webp'
 *
 * @param url - URL absolue ou chemin relatif
 * @returns chemin relatif du bucket, ou null si le format est invalide
 */
export function toRelativePath(url: string | null | undefined): string | null {
  if (!url) return null

  // Déjà un chemin relatif (pas de protocole HTTP/HTTPS)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url
  }

  // Firebase Storage: extraire le chemin depuis le paramètre /o/PATH
  if (url.includes('firebasestorage.googleapis.com')) {
    const match = url.match(/\/o\/([^?]+)/)
    if (match?.[1]) {
      try {
        // Décoder l'URL puisque Firebase encode les chemins (%2F pour /, etc.)
        return decodeURIComponent(match[1])
      } catch {
        // Fallback si le décodage échoue
        return match[1]
      }
    }
    return null
  }

  // R2 public URL: retirer le prefix
  if (R2_BASE_URL && url.startsWith(R2_BASE_URL)) {
    return url.slice(R2_BASE_URL.length).replace(/^\//, '')
  }

  // R2 custom domain: retirer le prefix
  if (url.startsWith(R2_CUSTOM_DOMAIN)) {
    return url.slice(R2_CUSTOM_DOMAIN.length).replace(/^\//, '')
  }

  // URL inconnue: retourner null pour signaler que le format n'est pas reconnu
  return null
}

/**
 * Construit l'URL publique absolue depuis un chemin relatif stocké en BDD.
 *
 * Gère la rétrocompatibilité: si la valeur est une URL absolue legacy (Firebase ou R2 ancien),
 * elle est d'abord normalisée vers un chemin relatif, puis reconstruite avec le base URL actuel.
 *
 * @param pathOrUrl - chemin relatif ex: "artists/Jean Dupont/profile.webp"
 *                    ou URL absolue legacy ex: "https://firebasestorage.googleapis.com/..."
 *                    ou "https://pub-xxx.r2.dev/..."
 * @returns URL absolue ex: "https://pub-xxx.r2.dev/artists/Jean Dupont/profile.webp"
 *          ou null si la valeur d'entrée est vide/null/undefined
 */
export function getImageUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null

  // Normaliser vers chemin relatif (gère les URLs absolues legacy en DB)
  const relativePath = toRelativePath(pathOrUrl)

  // Si on ne peut pas extraire le chemin (URL inconnue), retourner telle quelle
  // pour ne pas perdre les URLs que le système ne reconnaît pas (ex: Shopify CDN)
  if (!relativePath) {
    return pathOrUrl.startsWith('http') ? pathOrUrl : null
  }

  // Reconstruire l'URL complète avec le base URL actuel (R2)
  return `${R2_BASE_URL}/${relativePath}`.replace(/\/+/g, '/')
}

/**
 * Génère un hash 32 bits déterministe à partir d'une chaîne.
 * Même entrée => même hash. Utilisé comme cache buster stable.
 */
function createSimpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Tronquer à 32 bits
  }
  return Math.abs(hash).toString(36)
}

/**
 * Construit l'URL publique absolue avec un cache buster stable basé sur le chemin.
 *
 * Le paramètre `?t=<hash>` est déterministe : il ne change que si le fichier change de chemin,
 * ce qui force le rechargement de l'image dans le navigateur après un remplacement de photo
 * tout en évitant des requêtes inutiles si le chemin n'a pas bougé.
 *
 * Réservé aux images issues de la BDD. Ne pas appliquer aux blob: ou data: URLs locales.
 *
 * @param pathOrUrl - chemin relatif ou URL absolue legacy (même signature que getImageUrl)
 * @returns URL absolue avec query string ?t=<hash>, ou null si entrée vide
 */
export function getImageUrlWithCacheBuster(pathOrUrl: string | null | undefined): string | null {
  const url = getImageUrl(pathOrUrl)
  if (!url) return null

  // Calculer le hash sur le chemin relatif normalisé pour que le hash soit stable
  // même si le base URL change (changement de bucket, migration future)
  const relativePath = toRelativePath(pathOrUrl) ?? pathOrUrl ?? ''
  const hash = createSimpleHash(relativePath)
  return `${url}?t=${hash}`
}
