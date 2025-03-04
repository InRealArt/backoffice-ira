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
    }
] 