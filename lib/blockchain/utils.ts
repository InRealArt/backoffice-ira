import { Address, isAddress } from 'viem'
import { serverPublicClient } from '../server-providers'

/**
 * Vérifie si une chaîne de caractères est une adresse Ethereum valide
 * @param address - L'adresse à vérifier
 * @returns true si l'adresse est valide, false sinon
 */
export function isValidEthereumAddress(address: string): boolean {
  // Vérifie si l'adresse est une chaîne non vide
  if (!address || typeof address !== 'string') {
    return false
  }

  // Vérifie si l'adresse commence par '0x'
  if (!address.startsWith('0x')) {
    return false
  }

  // Vérifie si l'adresse a la bonne longueur (42 caractères = '0x' + 40 caractères hexadécimaux)
  if (address.length !== 42) {
    return false
  }

  // Vérifie si l'adresse contient uniquement des caractères hexadécimaux après le préfixe '0x'
  const hexRegex = /^0x[0-9a-fA-F]{40}$/
  if (!hexRegex.test(address)) {
    return false
  }

  // Option avancée : vérification du checksum EIP-55
  // Cette partie est optionnelle mais recommandée pour une validation plus stricte
  try {
    // Utilise la fonction isAddress de viem qui est déjà importée dans votre code
    return isAddress(address)
  } catch (error) {
    return false
  }

  return true
}

export function truncateAddress(address: string): string {
  if (!address) return 'Non défini'
  if (address.length <= 16) return address
  return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
}


/**
 * Récupère le propriétaire d'un token NFT en appelant la fonction ownerOf du contrat ERC721
 * @param tokenId - L'ID du token NFT
 * @param collectionAddress - L'adresse du contrat de collection NFT
 * @returns L'adresse du propriétaire du token ou null en cas d'erreur
 */
export async function getTokenOwner(
  tokenId: number | string,
  collectionAddress: Address | string
): Promise<Address | null> {
  if (!tokenId || !collectionAddress) return null;
  
  try {
    const ownerAddress = await serverPublicClient.readContract({
      address: collectionAddress as Address,
      abi: [
        {
          inputs: [{ name: 'tokenId', type: 'uint256' }],
          name: 'ownerOf',
          outputs: [{ name: '', type: 'address' }],
          stateMutability: 'view',
          type: 'function'
        }
      ],
      functionName: 'ownerOf',
      args: [BigInt(tokenId)]
    });
    
    return ownerAddress as Address;
  } catch (error) {
    console.error('Erreur lors de la récupération du propriétaire du NFT:', error);
    return null;
  }
}