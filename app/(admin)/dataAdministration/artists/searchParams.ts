import { parseAsString, createLoader } from 'nuqs/server'

// Configuration des paramètres de recherche pour les artistes
export const artistsSearchParams = {
  name: parseAsString.withDefault('')
}

// Loader pour le côté serveur
export const loadArtistsSearchParams = createLoader(artistsSearchParams)

