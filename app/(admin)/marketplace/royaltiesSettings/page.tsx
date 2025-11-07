import { prisma } from '@/lib/prisma'
import RoyaltiesSettingsClient from './RoyaltiesSettingsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Configuration des royalties | Marketplace',
  description: 'Gérez les paramètres de royalties pour les œuvres mintées',
}

export default async function RoyaltiesSettingsPage() {
  try {
    // Récupération des smart contracts disponibles
    const smartContracts = await prisma.smartContract.findMany({
      orderBy: {
        id: 'desc'
      }
    }) || []

    // Récupération des items avec statut MINED et leurs relations
    const minedItems: any[] =[]

    // Conversion des objets Decimal en nombres standard
    const serializedItems = minedItems.map(item => ({
      ...item,
      item: {
        ...item.item,
        physicalItem: item.item.physicalItem ? {
          ...item.item.physicalItem,
          height: item.item.physicalItem.height ? Number(item.item.physicalItem.height) : null,
          width: item.item.physicalItem.width ? Number(item.item.physicalItem.width) : null,
        } : null,
      },
      // Ces propriétés sont à ajuster selon vos besoins
      priceNftBeforeTax: null,
      pricePhysicalBeforeTax: null,
      priceNftPlusPhysicalBeforeTax: null,
    }))

    return <RoyaltiesSettingsClient minedItems={serializedItems as any} smartContracts={smartContracts} />
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error)
    return <RoyaltiesSettingsClient minedItems={[]} smartContracts={[]} />
  }
} 