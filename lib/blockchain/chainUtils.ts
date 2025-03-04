import { mainnet, sepolia, polygon, polygonMumbai } from 'wagmi/chains'

export function getChainId(chainName: string): number {
    switch (chainName) {
        case 'eth_mainnet':
            return mainnet.id
        case 'sepolia':
            return sepolia.id
        case 'polygon_mainnet':
            return polygon.id
        case 'polygon_testnet':
            return polygonMumbai.id
        default:
            throw new Error(`Chaîne non supportée: ${chainName}`)
    }
}

export function getChainName(chainId: number): string {
    switch (chainId) {
        case mainnet.id:
            return 'eth_mainnet'
        case sepolia.id:
            return 'sepolia'
        case polygon.id:
            return 'polygon_mainnet'
        case polygonMumbai.id:
            return 'polygon_testnet'
        default:
            throw new Error(`ID de chaîne non supporté: ${chainId}`)
    }
}

export function formatChainName(chain: string): string {
    switch (chain) {
        case 'eth_mainnet': return 'Ethereum Mainnet'
        case 'sepolia': return 'Sepolia'
        case 'polygon_mainnet': return 'Polygon Mainnet'
        case 'polygon_testnet': return 'Polygon Mumbai'
        default: return chain
    }
}

export function getChainByName(chainName: string) {
    switch (chainName) {
        case 'eth_mainnet':
            return mainnet
        case 'sepolia':
            return sepolia
        case 'polygon_mainnet':
            return polygon
        case 'polygon_testnet':
            return polygonMumbai
        default:
            throw new Error(`Chaîne non supportée: ${chainName}`)
    }
} 