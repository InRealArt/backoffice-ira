import { Address } from 'viem'
import { mainnet, sepolia, arbitrum, base } from 'viem/chains'

/**
 * Types des contrats disponibles
 */
export enum ContractName {
    NFT_FACTORY = 'nftFactory',
    NFT_MARKETPLACE = 'nftMarketplace',
    NFT_ROYALTIES = 'nftRoyalties',
}

/**
 * Interface pour les adresses de contrats par chaîne
 */
export interface ChainContracts {
    [contractName: string]: `0x${string}`
}

/**
 * Interface pour la configuration des adresses par chaîne
 */
export interface ContractAddresses {
    [chainId: number]: ChainContracts
}

/**
 * Adresses des smart contracts par réseau
 */
export const CONTRACT_ADDRESSES: ContractAddresses = {
    // Ethereum Mainnet
    [mainnet.id]: {
        [ContractName.NFT_FACTORY]: '' as Address,
        [ContractName.NFT_MARKETPLACE]: '' as Address,
        [ContractName.NFT_ROYALTIES]: '' as Address,
    },

    // Sepolia (testnet)
    [sepolia.id]: {
        [ContractName.NFT_FACTORY]: '0x061b0604e6A0c6CDAe32Fd5de3Cdfb93F8Cb12bc' as Address,
        [ContractName.NFT_MARKETPLACE]: '0xb0F8bc832B3154fE8e0AaE498cDF5a5fFC7150A2' as Address,
        [ContractName.NFT_ROYALTIES]: '0x17685381cf40e6F362eAa139CB93C5C3B6B0cbF3' as Address,
    },


    // Arbitrum
    [arbitrum.id]: {
        [ContractName.NFT_FACTORY]: '' as Address,
        [ContractName.NFT_MARKETPLACE]: '' as Address,
        [ContractName.NFT_ROYALTIES]: '' as Address,
    },

    // Base
    [base.id]: {
        [ContractName.NFT_FACTORY]: '' as Address,
            [ContractName.NFT_MARKETPLACE]: '' as Address,
        [ContractName.NFT_ROYALTIES]: '' as Address,
    }
}

/**
 * Réseaux supportés par l'application
 */
export const SUPPORTED_CHAINS = [
    mainnet,
    sepolia,
    arbitrum,
    base
] 