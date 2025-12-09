import { parseAsString, createLoader } from 'nuqs/server'

// Configuration des paramètres de recherche pour l'inventaire
export const inventorySearchParams = {
  name: parseAsString.withDefault('')
}

// Loader pour le côté serveur
export const loadInventorySearchParams = createLoader(inventorySearchParams)

