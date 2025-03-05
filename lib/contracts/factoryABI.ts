export const factoryABI = [
    {
        inputs: [
            { name: '_collectionName', type: 'string' },
            { name: '_collectionSymbol', type: 'string' },
            { name: '_adminAddress', type: 'address' },
            { name: '_artist', type: 'address' }
        ],
        name: 'createArtist',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'collectionAddress', type: 'address' },
            { indexed: true, name: 'admin', type: 'address' },
            { indexed: true, name: 'artist', type: 'address' }
        ],
        name: 'CollectionCreated',
        type: 'event'
    },
    {
        type: 'function',
        name: 'hasRole',
        inputs: [
            { name: 'role', type: 'bytes32', internalType: 'bytes32' },
            { name: 'account', type: 'address', internalType: 'address' }
        ],
        outputs: [
            { name: '', type: 'bool', internalType: 'bool' }
        ],
        stateMutability: 'view'
    }
] as const; 