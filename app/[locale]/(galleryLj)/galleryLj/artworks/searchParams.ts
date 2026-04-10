import { parseAsInteger, parseAsString, createParser, createLoader, createSerializer } from 'nuqs/server'

// Parser personnalisé pour sortDirection
const parseAsSortDirection = createParser({
    parse: (value: string) => {
        if (value === 'asc' || value === 'desc') {
            return value
        }
        return 'asc' as const
    },
    serialize: (value: 'asc' | 'desc') => value
})

// Configuration des paramètres de recherche pour les œuvres galerie LJ
export const galleryLjArtworksSearchParams = {
    sortColumn: parseAsString.withDefault('name'),
    sortDirection: parseAsSortDirection.withDefault('asc'),
    page: parseAsInteger.withDefault(1),
    itemsPerPage: parseAsInteger.withDefault(25)
}

// Loader pour le côté serveur
export const loadGalleryLjArtworksSearchParams = createLoader(galleryLjArtworksSearchParams)

// Serializer pour générer les URLs
export const serializeGalleryLjArtworksSearchParams = createSerializer(galleryLjArtworksSearchParams)
