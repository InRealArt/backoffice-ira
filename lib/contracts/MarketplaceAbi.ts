
export const marketplaceAbi = 
[
    {
      "type": "constructor",
      "inputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "DEFAULT_ADMIN_ROLE",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "MARKETPLACE_ADMIN_ROLE",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "SELLER_ROLE",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "UPGRADE_ADMIN_ROLE",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "UPGRADE_INTERFACE_VERSION",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "string",
          "internalType": "string"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "acceptDefaultAdminTransfer",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "addMarketPlaceAdminRole",
      "inputs": [
        {
          "name": "_marketPlaceAdminRole",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "addSellerRole",
      "inputs": [
        {
          "name": "_sellerRole",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "beginDefaultAdminTransfer",
      "inputs": [
        {
          "name": "newAdmin",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "cancelDefaultAdminTransfer",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "cancelListing",
      "inputs": [
        {
          "name": "_itemId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "changeDefaultAdminDelay",
      "inputs": [
        {
          "name": "newDelay",
          "type": "uint48",
          "internalType": "uint48"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "defaultAdmin",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "defaultAdminDelay",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint48",
          "internalType": "uint48"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "defaultAdminDelayIncreaseWait",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint48",
          "internalType": "uint48"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "feeAdmin",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address payable"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "feePercent",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getArtistRoyalties",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "contract ArtistRoyalties"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getImplementation",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getIsNftListed",
      "inputs": [
        {
          "name": "nftCollection_",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "tokenId_",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getItem",
      "inputs": [
        {
          "name": "_itemId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "item_",
          "type": "tuple",
          "internalType": "struct IMarketplace.Item",
          "components": [
            {
              "name": "itemId",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "nft",
              "type": "address",
              "internalType": "contract IERC721"
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "price",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "seller",
              "type": "address",
              "internalType": "address payable"
            },
            {
              "name": "sold",
              "type": "bool",
              "internalType": "bool"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getItemCount",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getRoleAdmin",
      "inputs": [
        {
          "name": "role",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getSuperAdmin",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getTotalPrice",
      "inputs": [
        {
          "name": "_itemId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getUpgradeAdmin",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getWasNftListedAtLeastOnce",
      "inputs": [
        {
          "name": "nftCollection_",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "tokenId_",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "grantRole",
      "inputs": [
        {
          "name": "role",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "hasRole",
      "inputs": [
        {
          "name": "role",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "initialize",
      "inputs": [
        {
          "name": "_superAdmin",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_upgradeAdmin",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_feePercent",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "artistRoyaltiesAddress_",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "isSold",
      "inputs": [
        {
          "name": "itemId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "items",
      "inputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "itemId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "nft",
          "type": "address",
          "internalType": "contract IERC721"
        },
        {
          "name": "tokenId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "price",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "seller",
          "type": "address",
          "internalType": "address payable"
        },
        {
          "name": "sold",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "listItem",
      "inputs": [
        {
          "name": "_nft",
          "type": "address",
          "internalType": "contract IERC721"
        },
        {
          "name": "_tokenId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_price",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "pendingDefaultAdmin",
      "inputs": [],
      "outputs": [
        {
          "name": "newAdmin",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "schedule",
          "type": "uint48",
          "internalType": "uint48"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "pendingDefaultAdminDelay",
      "inputs": [],
      "outputs": [
        {
          "name": "newDelay",
          "type": "uint48",
          "internalType": "uint48"
        },
        {
          "name": "schedule",
          "type": "uint48",
          "internalType": "uint48"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "proxiableUUID",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "purchaseItem",
      "inputs": [
        {
          "name": "_itemId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "renounceRole",
      "inputs": [
        {
          "name": "role",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "revokeRole",
      "inputs": [
        {
          "name": "role",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "rollbackDefaultAdminDelay",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "supportsInterface",
      "inputs": [
        {
          "name": "interfaceId",
          "type": "bytes4",
          "internalType": "bytes4"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "transferToFeeAdminMarketPlace",
      "inputs": [
        {
          "name": "_nft",
          "type": "address",
          "internalType": "contract IERC721"
        },
        {
          "name": "tokenId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "upgradeToAndCall",
      "inputs": [
        {
          "name": "newImplementation",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "data",
          "type": "bytes",
          "internalType": "bytes"
        }
      ],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "upgradeToAndCallSecure",
      "inputs": [
        {
          "name": "newImplementation",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "data",
          "type": "bytes",
          "internalType": "bytes"
        }
      ],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "event",
      "name": "Bought",
      "inputs": [
        {
          "name": "itemId",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "nft",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "tokenId",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "price",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "seller",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "buyer",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "DefaultAdminDelayChangeCanceled",
      "inputs": [],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "DefaultAdminDelayChangeScheduled",
      "inputs": [
        {
          "name": "newDelay",
          "type": "uint48",
          "indexed": false,
          "internalType": "uint48"
        },
        {
          "name": "effectSchedule",
          "type": "uint48",
          "indexed": false,
          "internalType": "uint48"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "DefaultAdminTransferCanceled",
      "inputs": [],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "DefaultAdminTransferScheduled",
      "inputs": [
        {
          "name": "newAdmin",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "acceptSchedule",
          "type": "uint48",
          "indexed": false,
          "internalType": "uint48"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "Initialized",
      "inputs": [
        {
          "name": "version",
          "type": "uint64",
          "indexed": false,
          "internalType": "uint64"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "ListingCancelled",
      "inputs": [
        {
          "name": "itemId",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "seller",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "Offered",
      "inputs": [
        {
          "name": "itemId",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "nft",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "tokenId",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "price",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "seller",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "RoleAdminChanged",
      "inputs": [
        {
          "name": "role",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "previousAdminRole",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "newAdminRole",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "RoleGranted",
      "inputs": [
        {
          "name": "role",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "account",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "sender",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "RoleRevoked",
      "inputs": [
        {
          "name": "role",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "account",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "sender",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "Upgraded",
      "inputs": [
        {
          "name": "implementation",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "error",
      "name": "AccessControlBadConfirmation",
      "inputs": []
    },
    {
      "type": "error",
      "name": "AccessControlEnforcedDefaultAdminDelay",
      "inputs": [
        {
          "name": "schedule",
          "type": "uint48",
          "internalType": "uint48"
        }
      ]
    },
    {
      "type": "error",
      "name": "AccessControlEnforcedDefaultAdminRules",
      "inputs": []
    },
    {
      "type": "error",
      "name": "AccessControlInvalidDefaultAdmin",
      "inputs": [
        {
          "name": "defaultAdmin",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "AccessControlUnauthorizedAccount",
      "inputs": [
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "neededRole",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ]
    },
    {
      "type": "error",
      "name": "AddressEmptyCode",
      "inputs": [
        {
          "name": "target",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "AddressZeroError",
      "inputs": [
        {
          "name": "param",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ]
    },
    {
      "type": "error",
      "name": "BalanceEtherError",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ERC1967InvalidImplementation",
      "inputs": [
        {
          "name": "implementation",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "ERC1967NonPayable",
      "inputs": []
    },
    {
      "type": "error",
      "name": "FailedInnerCall",
      "inputs": []
    },
    {
      "type": "error",
      "name": "FeeZeroError",
      "inputs": []
    },
    {
      "type": "error",
      "name": "FirstListingMustBeDoneByFeeAdmin",
      "inputs": []
    },
    {
      "type": "error",
      "name": "InvalidInitialization",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ItemAlreadySoldError",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ItemDoesNotExistError",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NftAlreadyListedError",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NotInitializing",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NotSellerError",
      "inputs": []
    },
    {
      "type": "error",
      "name": "PriceZeroError",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ReentrancyGuardReentrantCall",
      "inputs": []
    },
    {
      "type": "error",
      "name": "RoyaltiesNotConfiguredError",
      "inputs": [
        {
          "name": "nftCollection",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "tokenId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "RoyaltyTransferFailedError",
      "inputs": [
        {
          "name": "recipient",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "SafeCastOverflowedUintDowncast",
      "inputs": [
        {
          "name": "bits",
          "type": "uint8",
          "internalType": "uint8"
        },
        {
          "name": "value",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "UUPSUnauthorizedCallContext",
      "inputs": []
    },
    {
      "type": "error",
      "name": "UUPSUnsupportedProxiableUUID",
      "inputs": [
        {
          "name": "slot",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ]
    },
    {
      "type": "error",
      "name": "UnauthorizedNewImplementationWithNullAddress",
      "inputs": []
    },
    {
      "type": "error",
      "name": "UnauthorizedUpgrade",
      "inputs": [
        {
          "name": "msgSender",
          "type": "address",
          "internalType": "address"
        }
      ]
    }
  ]
  