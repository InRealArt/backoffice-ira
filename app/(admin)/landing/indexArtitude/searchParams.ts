import { parseAsString, createLoader } from 'nuqs/server'

// Configuration des paramètres de recherche pour l'index Artitude
export const indexArtitudeSearchParams = {
  name: parseAsString.withDefault('')
}

// Loader pour le côté serveur
export const loadIndexArtitudeSearchParams = createLoader(indexArtitudeSearchParams)
