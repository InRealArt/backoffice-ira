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

// Configuration des paramètres de recherche pour les artistes galerie LJ
export const galleryLjArtistsSearchParams = {
    sortColumn: parseAsString.withDefault('pseudo'),
    sortDirection: parseAsSortDirection.withDefault('asc'),
    page: parseAsInteger.withDefault(1),
    itemsPerPage: parseAsInteger.withDefault(25)
}

// Loader pour le côté serveur
export const loadGalleryLjArtistsSearchParams = createLoader(galleryLjArtistsSearchParams)

// Serializer pour générer les URLs
export const serializeGalleryLjArtistsSearchParams = createSerializer(galleryLjArtistsSearchParams)
