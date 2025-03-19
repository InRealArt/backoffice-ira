import { isAddress } from 'viem'

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
  
  
