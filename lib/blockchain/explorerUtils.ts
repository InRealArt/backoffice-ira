import { NetworkType } from '@prisma/client'

/**
 * Génère une URL vers l'explorateur de blocs approprié en fonction du réseau
 * @param network - Le type de réseau (mainnet, sepolia, polygon, etc.)
 * @param address - L'adresse du contrat ou du portefeuille
 * @returns L'URL complète vers l'explorateur de blocs
 */
export function getBlockExplorerUrl(network: NetworkType | string, address: string): string {
    // S'assurer que l'adresse est valide
    if (!address || !address.startsWith('0x')) {
        return '#'
    }

    // Définir les URLs de base pour chaque explorateur de blocs par réseau
    const explorers: Record<string, string> = {
        mainnet: 'https://etherscan.io',
        sepolia: 'https://sepolia.etherscan.io',
        polygon: 'https://polygonscan.com',
        polygonAmoy: 'https://amoy.polygonscan.com',
        arbitrum: 'https://arbiscan.io',
        base: 'https://basescan.org',
        sepoliaBase: 'https://sepolia.basescan.org'
    }

    // Récupérer l'URL de base de l'explorateur pour ce réseau
    const baseUrl = explorers[network] || 'https://sepolia.etherscan.io' // Fallback sur Sepolia

    // Construire l'URL complète
    return `${baseUrl}/address/${address}`
} 