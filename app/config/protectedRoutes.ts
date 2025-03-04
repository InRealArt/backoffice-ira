// Configuration des routes protégées avec leur niveau d'accès requis
const protectedRoutes: Record<string, AccessLevel> = {
    // Routes admin
    "/shopify/create-member": "admin",
    "/shopify/users": "admin",
    "/blockchain/artists": "admin",
    "/blockchain/collections": "admin",
    "/blockchain/factories": "admin",
    // Routes artiste
    "/shopify/createArtwork": "artist",
    "/shopify/collection": "artist",
    "/shopify/artworks": "artist",

    // Routes nécessitant uniquement une connexion
    "/dashboard": "auth",
    "/profile": "auth",

    // Routes publiques (pas besoin de les lister, elles sont accessibles par défaut)
}

export type AccessLevel = "admin" | "artist" | "auth"

export function getRequiredAccessLevel(path: string): AccessLevel | null {
    // Vérifier les correspondances exactes
    if (path in protectedRoutes) {
        return protectedRoutes[path as keyof typeof protectedRoutes]
    }

    // Vérifier les préfixes de chemin
    for (const route in protectedRoutes) {
        if (path.startsWith(route + '/')) {
            return protectedRoutes[route as keyof typeof protectedRoutes]
        }
    }

    // Pas de restriction pour ce chemin
    return null
}

export default protectedRoutes 