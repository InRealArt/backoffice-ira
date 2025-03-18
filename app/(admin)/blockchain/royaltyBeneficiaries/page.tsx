import { prisma } from '@/lib/prisma'
import RoyaltyBeneficiariesClient from './RoyaltyBeneficiariesClient'
import { SmartContract } from '@prisma/client'


export const metadata = {
  title: 'Bénéficiaires de royalties | Blockchain',
  description: 'Gérez les bénéficiaires de royalties dans le système'
}

export default async function RoyaltyBeneficiariesPage() {
  // Récupération des bénéficiaires de royalties avec leurs relations
  const royaltyBeneficiaries = await prisma.royaltyBeneficiary.findMany({
    orderBy: {
      id: 'desc'
    },
    include: {
      nftResource: {
        include: {
          collection: {
            include: {
              smartContract: true
            }
          }
        }
      }
    }
  }).catch(error => {
    console.error('Erreur lors de la récupération des bénéficiaires de royalties:', error)
    return []
  })

  // Récupération des smart contracts pour le filtre
  const smartContracts = await prisma.smartContract.findMany({
    orderBy: {
      id: 'desc'
    }
  }).catch(error => {
    console.error('Erreur lors de la récupération des smart contracts:', error)
    return []
  })

  return <RoyaltyBeneficiariesClient 
    royaltyBeneficiaries={royaltyBeneficiaries} 
    smartContracts={smartContracts} 
  />
} 