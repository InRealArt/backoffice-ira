import { parseAsString, createLoader } from 'nuqs/server'

// Configuration des paramètres de recherche pour les landing artists
export const landingArtistsSearchParams = {
  name: parseAsString.withDefault('')
}

// Loader pour le côté serveur
export const loadLandingArtistsSearchParams = createLoader(landingArtistsSearchParams)

