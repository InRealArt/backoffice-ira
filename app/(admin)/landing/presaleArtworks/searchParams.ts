import { parseAsInteger, parseAsString, createParser, createLoader, createSerializer } from 'nuqs/server'

// Parser personnalisé pour sortDirection
const parseAsSortDirection = createParser({
    parse: (value: string) => {
        if (value === 'asc' || value === 'desc') {
            return value
        }
        return 'asc' // valeur par défaut
    },
    serialize: (value: 'asc' | 'desc') => value
})

// Configuration des paramètres de recherche pour les presaleArtworks
export const presaleArtworksSearchParams = {
    artistId: parseAsInteger,
    sortColumn: parseAsString.withDefault('order'),
    sortDirection: parseAsSortDirection.withDefault('asc'),
    page: parseAsInteger.withDefault(1),
    itemsPerPage: parseAsInteger.withDefault(25)
}

// Loader pour le côté serveur
export const loadPresaleArtworksSearchParams = createLoader(presaleArtworksSearchParams)

// Serializer pour générer les URLs
export const serializePresaleArtworksSearchParams = createSerializer(presaleArtworksSearchParams)
