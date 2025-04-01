// Configuration des routes protégées avec leur niveau d'accès requis
const protectedRoutes: Record<string, AccessLevel> = {
    // Routes admin
    "/landing/languages": "admin",
    "/landing/languages/[id]/edit": "admin",
    "/landing/teams": "admin",
    "/landing/teams/[id]/edit": "admin",
    "/landing/faq": "admin",
    "/landing/faq/[id]/edit": "admin",
    "/landing/detailedFaq": "admin",
    "/landing/detailedFaq/[id]/edit": "admin",
    "/landing/detailedGlossary": "admin",
    "/landing/detailedGlossary/[id]/edit": "admin",
    "/landing/presaleArtworks": "admin",
    "/landing/presaleArtworks/[id]/edit": "admin",
    "/landing/presaleArtworks/new": "admin",
    "/shopify/create-member": "admin",
    "/shopify/users": "admin",
    "/dataAdministration/artists": "admin",
    "/dataAdministration/artists/[id]/edit": "admin",
    "/dataAdministration/itemCategories": "admin",
    "/dataAdministration/itemCategories/[id]/edit": "admin",
    "/blockchain/collections": "admin",
    "/blockchain/collections/[id]/edit": "admin",
    "/blockchain/factories": "admin",
    "/blockchain/factories/[id]/edit": "admin",
    "/blockchain/royaltyBeneficiaries": "admin",
    "/blockchain/royaltyBeneficiaries/[id]/edit": "admin",
    "/marketplace/nftsToMint": "admin",
    "/marketplace/nftsToMint/[id]/edit": "admin",
    "/marketplace/royaltiesSettings": "admin",
    "/marketplace/royaltiesSettings/[id]/edit": "admin",
    "/marketplace/marketplaceListing": "admin",
    "/marketplace/marketplaceListing/[id]/edit": "admin",
    "/presale-artworks": "admin",
    "/presale-artworks/[id]/edit": "admin",
    "/presale-artworks/new": "admin",
    // Routes artiste
    "/shopify/createArtwork": "artist",
    "/shopify/collection": "artist",
    "/shopify/artworks": "artist",
    "/shopify/artworks/[id]/edit": "artist",
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