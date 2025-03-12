import { prisma } from '@/lib/prisma'
import RoyaltiesSettingsClient from './RoyaltiesSettingsClient'


export const metadata = {
  title: 'Configuration des royalties | Marketplace',
  description: 'Gérez les paramètres de royalties pour les œuvres mintées',
}

export default async function RoyaltiesSettingsPage() {
  try {
    // Récupération des items avec statut MINED et leurs relations
    const minedItems = await prisma.item.findMany({
      where: {
        nftResource: {
          status: 'MINED'
        }
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        nftResource: {
          select: {
            name: true,
            status: true,
            type: true,
            imageUri: true,
            certificateUri: true,
            tokenId: true
          }
        }
      }
    }) || []

    return <RoyaltiesSettingsClient minedItems={minedItems as any} />
  } catch (error) {
    console.error('Erreur lors de la récupération des items mintés:', error)
    return <RoyaltiesSettingsClient minedItems={[]} />
  }
} 