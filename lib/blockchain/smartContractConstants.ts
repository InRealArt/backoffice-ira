import { keccak256, toBytes } from 'viem'

export const InRealArtRoles = {
    DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
    DEPLOYER_ARTIST_ROLE: keccak256(toBytes("DEPLOYER_ARTIST_ROLE")),
    ADMIN_ROYALTIES_ROLE: keccak256(toBytes("ADMIN_ROYALTIES_ROLE")),
} as const

export const InRealArtSmartContractConstants = {
    PERCENTAGE_PRECISION: 100
} as const
