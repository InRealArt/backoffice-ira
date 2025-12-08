import { parseAsInteger, createParser, createLoader, createSerializer } from 'nuqs/server'

// Configuration des paramètres de recherche pour myPhysicalArtwork
export const myPhysicalArtworkSearchParams = {
  collectionId: parseAsInteger,
}

// Loader pour le côté serveur
export const loadMyPhysicalArtworkSearchParams = createLoader(myPhysicalArtworkSearchParams)

// Serializer pour générer les URLs
export const serializeMyPhysicalArtworkSearchParams = createSerializer(myPhysicalArtworkSearchParams)

