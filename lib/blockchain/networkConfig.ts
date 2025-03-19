import { NetworkType } from '@prisma/client'
import { Chain, polygonAmoy, polygon, sepolia, mainnet } from 'viem/chains'

interface NetworkConfig {
  production: NetworkType
  development: NetworkType
}

const networks: NetworkConfig = {
  production: 'mainnet' as NetworkType,
  development: 'sepolia' as NetworkType,
}

export const getNetwork = (): NetworkType => {
  return process.env.NODE_ENV === 'production'  
    ? networks.production 
    : networks.development
}
