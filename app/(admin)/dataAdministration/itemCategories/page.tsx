import { prisma } from '@/lib/prisma'
import ItemCategoriesClient from './ItemCategoriesClient'
import { ItemCategory } from '@prisma/client'

export const metadata = {
  title: 'Liste des catégories d\'œuvres | Administration',
  description: 'Gérez les catégories d\'œuvres enregistrées dans le système',
}

export default async function ItemCategoriesPage() {
  let itemCategories: ItemCategory[] = []
  
  try {
    itemCategories = await prisma.itemCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    }) || []
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error)
  }

  return <ItemCategoriesClient itemCategories={itemCategories} />
} 