import { Address } from 'viem'
import { mainnet, sepolia, arbitrum, base } from 'viem/chains'
import { SEPOLIA_NFT_FACTORY_ADDRESS, SEPOLIA_NFT_ROYALTIES_ADDRESS, SEPOLIA_NFT_MARKETPLACE_ADDRESS } from './contractAddresses'

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
        [ContractName.NFT_FACTORY]: SEPOLIA_NFT_FACTORY_ADDRESS as Address,
        [ContractName.NFT_MARKETPLACE]: SEPOLIA_NFT_MARKETPLACE_ADDRESS as Address,
        [ContractName.NFT_ROYALTIES]: SEPOLIA_NFT_ROYALTIES_ADDRESS as Address,
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