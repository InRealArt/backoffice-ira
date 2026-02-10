import { parseAsString, createLoader } from 'nuqs/server'

// Configuration des paramètres de recherche pour les posts SEO
export const seoPostsSearchParams = {
  title: parseAsString.withDefault(''),
  language: parseAsString.withDefault(''),
  category: parseAsString.withDefault('')
}

// Loader pour le côté serveur
export const loadSeoPostsSearchParams = createLoader(seoPostsSearchParams)
