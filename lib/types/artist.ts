/**
 * Types centralisés pour l'entité Artist
 *
 * Objectif : éviter la redéfinition de types quasi-identiques dans chaque composant
 * suite au passage de name/surname en champs optionnels (String?).
 */

/**
 * Champs identitaires minimaux d'un artiste.
 * Utilisé partout où seul le nom/pseudo est nécessaire.
 */
export interface ArtistName {
    name: string | null
    surname: string | null
    pseudo: string | null
}

/**
 * Shape minimal retourné par les queries sur Artist dans les formulaires.
 * Champs communs, sans idUser (qui est un champ calculé côté serveur).
 */
export interface ArtistListItemBase extends ArtistName {
    id: number
    description: string
    publicKey: string
    imageUrl: string
    isGallery: boolean
    backgroundImage: string | null
}

/**
 * Shape retourné par getAllArtists() et getAllArtistsAndGalleries().
 * Inclut idUser (calculé depuis BackofficeUser).
 * Utilisé dans les dropdowns admin et les formulaires de membres.
 */
export interface ArtistListItem extends ArtistListItemBase {
    idUser: string | null
}

/**
 * Shape retourné par getArtistsWithPresaleArtworkCount().
 * Utilisé dans InventoryClient et les pages d'inventaire.
 */
export interface ArtistWithCount extends ArtistName {
    id: number
    imageUrl: string
    presaleArtworkCount: number
    landingArtistId: number | null
    onboardingBo: Date | null
}

/**
 * Champs minimaux pour afficher un artiste dans une liste d'œuvres.
 * Utilisé dans SortableArtworkItem, DisplayOrderManager.
 */
export interface ArtistMini extends ArtistName {
    id?: number
}
