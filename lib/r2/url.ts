/**
 * Construit l'URL publique absolue depuis un chemin relatif stocké en BDD.
 *
 * Gère la période de transition : les anciennes URLs absolues (Firebase ou R2)
 * déjà présentes en BDD sont retournées telles quelles.
 *
 * @param relativePath - chemin relatif ex: "artists/Jean Dupont/profile.webp"
 *                       ou URL absolue legacy ex: "https://firebasestorage.googleapis.com/..."
 * @returns URL absolue ex: "https://pub-xxx.r2.dev/artists/Jean Dupont/profile.webp"
 *          ou null si la valeur d'entrée est vide/null/undefined
 */
export function getImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null

  // Si c'est déjà une URL absolue (URLs legacy Firebase ou R2 en BDD), la retourner telle quelle
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath
  }

  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ''
  return `${baseUrl}/${relativePath}`
}
