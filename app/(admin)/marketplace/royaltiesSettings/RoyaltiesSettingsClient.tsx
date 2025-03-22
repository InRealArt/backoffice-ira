'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { Item, ResourceNftStatuses, ResourceTypes, SmartContract } from '@prisma/client'
import { formatChainName } from '@/lib/blockchain/chainUtils'
import NftStatusBadge from '@/app/components/Nft/NftStatusBadge'
import { getActiveBadge } from '@/app/components/StatusBadge'
import BlockchainAddress from '@/app/components/blockchain/BlockchainAddress'
import { truncateAddress } from '@/lib/blockchain/utils'
import { Filters, FilterItem } from '@/app/components/Common/Filters'
import { StatusRow } from '@/app/components/Table'

// Type pour inclure le smartContractId
type MinedItemWithRelations = Item & {
  user: {
    email: string | null
    firstName: string | null
    lastName: string | null
  }
  nftResource: {
    name: string
    status: ResourceNftStatuses
    type: ResourceTypes
    imageUri: string | null
    certificateUri: string | null
    tokenId: number | null
    collection: {
      id: number
      name: string
      smartContractId: number | null
      smartContract?: {
        id: number
        active: boolean
        factoryAddress: string
        network: string
      } | null
    }
  } | null
}

interface RoyaltiesSettingsClientProps {
  minedItems: MinedItemWithRelations[]
  smartContracts: SmartContract[]
}

export default function RoyaltiesSettingsClient({ minedItems = [], smartContracts = [] }: RoyaltiesSettingsClientProps) {
  const router = useRouter()
  const [items, setItems] = useState(minedItems)
  const [isMobile, setIsMobile] = useState(false)
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null)
  const [selectedSmartContractId, setSelectedSmartContractId] = useState<number | null>(null)
  const [collectionFilter, setCollectionFilter] = useState<string>('')
  
  // Extraction des collections uniques pour le filtre
  const uniqueCollections = useMemo(() => {
    const collectionsMap = new Map();
    
    items.forEach(item => {
      if (item.nftResource?.collection?.id && item.nftResource?.collection?.name) {
        collectionsMap.set(
          item.nftResource.collection.id, 
          item.nftResource.collection.name
        );
      }
    });
    
    return Array.from(collectionsMap).map(([id, name]) => ({
      value: id.toString(),
      label: name
    }));
  }, [items]);
  
  // Détecte si l'écran est de taille mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Vérifier au chargement
    checkIfMobile()
    
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])
  
  const handleItemClick = (itemId: number) => {
    setLoadingItemId(itemId)
    router.push(`/marketplace/royaltiesSettings/${itemId}/edit`)
  }
  
  // Filtrage des items par smart contract et collection
  const filteredItems = items
    .filter(item => {
      // Filtre par smart contract si sélectionné
      if (selectedSmartContractId) {
        const smartContractId = item.nftResource?.collection?.smartContractId;
        const smartContract = item.nftResource?.collection?.smartContract;
        
        if (!(smartContractId === selectedSmartContractId || 
              (smartContract && Number(smartContract.id) === selectedSmartContractId))) {
          return false;
        }
      }
      
      // Filtre par collection si sélectionnée
      if (collectionFilter && item.nftResource?.collection?.id) {
        return item.nftResource.collection.id.toString() === collectionFilter;
      }
      
      return true;
    });
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Configuration des royalties</h1>
        </div>
        <p className="page-subtitle">
          Gérez les paramètres de royalties pour les œuvres mintées
        </p>
      </div>
      
      <Filters>
        <FilterItem
          id="smartContractFilter"
          label="Filtrer par smart contract:"
          value={selectedSmartContractId ? selectedSmartContractId.toString() : ''}
          onChange={(value) => setSelectedSmartContractId(value ? parseInt(value) : null)}
          options={[
            { value: '', label: 'Tous les smart contracts' },
            ...smartContracts.map(smartContract => ({
              value: smartContract.id.toString(),
              label: `${smartContract.active ? '🟢 ' : '🔴 '} ${formatChainName(smartContract.network)} - ${truncateAddress(smartContract.factoryAddress)}`
            }))
          ]}
        />
        
        <FilterItem
          id="collectionFilter"
          label="Filtrer par collection:"
          value={collectionFilter}
          onChange={setCollectionFilter}
          options={[
            { value: '', label: 'Toutes les collections' },
            ...uniqueCollections
          ]}
        />
      </Filters>
      
      <div className="page-content">
        {!filteredItems.length ? (
          <div className="empty-state">
            <p>Aucune œuvre mintée disponible</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>Token ID</th>
                  <th>Nom NFT</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>Collection</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>Artiste</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>Factory</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLoading = loadingItemId === item.id
                  const smartContract = item.nftResource?.collection?.smartContract || null;
                  const isActive = smartContract?.active ?? true;
                  
                  return (
                    <StatusRow 
                      key={item.id}
                      isActive={isActive}
                      colorType="danger"
                      className={`clickable-row ${isLoading ? 'loading-row' : ''} ${loadingItemId && !isLoading ? 'disabled-row' : ''}`}
                      onClick={() => !loadingItemId && handleItemClick(item.id)}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? 'text-muted' : ''}>
                            {item.id}
                          </span>
                        </div>
                      </td>
                      <td className={isMobile ? 'hidden-mobile' : ''}>
                        {item.nftResource?.tokenId || 'N/A'}
                      </td>
                      <td>
                        {item.nftResource?.name}
                      </td>
                      <td className={isMobile ? 'hidden-mobile' : ''}>
                        {item.nftResource?.collection?.name || 'N/A'}
                      </td>
                      <td className={isMobile ? 'hidden-mobile' : ''}>
                        {item.user ? 
                          `${item.user.firstName || ''} ${item.user.lastName || ''} ${item.user.email ? `(${item.user.email})` : ''}`.trim() : 
                          'N/A'
                        }
                      </td>
                      <td className={isMobile ? 'hidden-mobile' : ''}>
                        {smartContract ? (
                          <div className="d-flex align-items-center gap-xs">
                            <BlockchainAddress 
                              address={smartContract.factoryAddress} 
                              network={smartContract.network}
                            />
                            {getActiveBadge(smartContract.active)}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>
                        <div className="status-badge-container">
                          <NftStatusBadge status={item.nftResource?.status || 'MINED'} />
                        </div>
                      </td>
                    </StatusRow>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 