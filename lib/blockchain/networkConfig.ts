import { Chain, polygonAmoy, polygon, sepolia, mainnet } from 'viem/chains'

interface NetworkConfig {
  production: Chain
  development: Chain
}

const networks: NetworkConfig = {
  production: mainnet,
  development: sepolia,
}

export const getNetwork = (): Chain => {
  return process.env.NODE_ENV === 'production'  
    ? networks.production 
    : networks.development
}
