import { parseAsInteger, createParser, createLoader, createSerializer } from 'nuqs/server'

// Parser personnalisé pour commercialStatus
const parseAsCommercialStatus = createParser({
  parse: (value: string) => {
    if (value === 'AVAILABLE' || value === 'UNAVAILABLE') {
      return value
    }
    return null
  },
  serialize: (value: 'AVAILABLE' | 'UNAVAILABLE' | null) => value || ''
})

// Configuration des paramètres de recherche pour myPhysicalArtwork
export const myPhysicalArtworkSearchParams = {
  collectionId: parseAsInteger,
  commercialStatus: parseAsCommercialStatus,
}

// Loader pour le côté serveur
export const loadMyPhysicalArtworkSearchParams = createLoader(myPhysicalArtworkSearchParams)

// Serializer pour générer les URLs
export const serializeMyPhysicalArtworkSearchParams = createSerializer(myPhysicalArtworkSearchParams)

