import { prisma } from '@/lib/prisma'
import RoyaltyBeneficiariesClient from './RoyaltyBeneficiariesClient'
import { SmartContract } from '@prisma/client'


export const metadata = {
  title: 'Bénéficiaires de royalties | Blockchain',
  description: 'Gérez les bénéficiaires de royalties dans le système'
}

// Modification de la fonction nullToUndefined pour assurer qu'elle préserve les tableaux
const nullToUndefined = <T,>(obj: T): T => {
  if (obj === null) return undefined as any;
  if (!obj) return obj; // Retourne l'objet tel quel s'il est falsy mais pas null
  if (Array.isArray(obj)) {
    // Traiter chaque élément du tableau individuellement
    return obj.map(item => nullToUndefined(item)) as any;
  }
  if (typeof obj !== 'object') return obj;
  
  const result = { ...obj } as any;
  for (const key in result) {
    if (result[key] === null) {
      result[key] = undefined;
    } else if (typeof result[key] === 'object') {
      result[key] = nullToUndefined(result[key]);
    }
  }
  
  return result;
};

export default async function RoyaltyBeneficiariesPage() {
  console.log('Chargement de la page RoyaltyBeneficiariesPage')
  
  // Récupération des bénéficiaires de royalties avec leurs relations
  const rawRoyaltyBeneficiaries = await prisma.royaltyBeneficiary.findMany({
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

  console.log('Nombre de bénéficiaires récupérés:', rawRoyaltyBeneficiaries.length)
  console.log('Premier bénéficiaire (si disponible):', 
    rawRoyaltyBeneficiaries.length > 0 ? 
    JSON.stringify(rawRoyaltyBeneficiaries[0], null, 2) : 'Aucun')

  // Récupération des smart contracts pour le filtre
  const smartContracts = await prisma.smartContract.findMany({
    orderBy: {
      id: 'desc'
    }
  }).catch(error => {
    console.error('Erreur lors de la récupération des smart contracts:', error)
    return []
  })

  console.log('Nombre de smart contracts récupérés:', smartContracts.length)

  // Alternative: passer directement les données brutes et gérer les null dans le client
  if (rawRoyaltyBeneficiaries.length > 0) {
    // Essayer d'utiliser directement les données brutes si la transformation échoue
    const transformedBeneficiaries = nullToUndefined(rawRoyaltyBeneficiaries);
    console.log('Transformation réussie?', 
      Array.isArray(transformedBeneficiaries), 
      transformedBeneficiaries?.length || 0
    );
    
    // Utiliser les données transformées si elles sont valides, sinon utiliser les données brutes
    const beneficiariesToUse = 
      (Array.isArray(transformedBeneficiaries) && transformedBeneficiaries.length > 0) 
        ? transformedBeneficiaries 
        : rawRoyaltyBeneficiaries;
    
    return <RoyaltyBeneficiariesClient 
      royaltyBeneficiaries={beneficiariesToUse as any} 
      smartContracts={smartContracts} 
    />;
  }
  
  // Si aucune donnée, afficher une page vide
  return <RoyaltyBeneficiariesClient 
    royaltyBeneficiaries={rawRoyaltyBeneficiaries as any} 
    smartContracts={smartContracts} 
  />;
} 