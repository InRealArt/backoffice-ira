'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { Item, ResourceNftStatuses, ResourceTypes, SmartContract } from '@prisma/client'
import { formatChainName } from '@/lib/blockchain/chainUtils'
import NftStatusBadge from '@/app/components/Nft/NftStatusBadge'
import { getActiveBadge } from '@/app/components/StatusBadge'
import BlockchainAddress from '@/app/components/blockchain/BlockchainAddress'
import { truncateAddress } from '@/lib/blockchain/utils'
import { Filters, FilterItem } from '@/app/components/Common'

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
  
  // Filtrage des items par smart contract
  const filteredItems = selectedSmartContractId
    ? items.filter(item => {
        // Utiliser smartContractId de la collection en priorité
        const smartContractId = item.nftResource?.collection?.smartContractId;
        if (smartContractId === selectedSmartContractId) return true;
        
        // Si ce n'est pas trouvé, essayer via l'objet smartContract
        const smartContract = item.nftResource?.collection?.smartContract;
        if (smartContract && Number(smartContract.id) === selectedSmartContractId) return true;
        
        return false;
      })
    : items;
  
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
                  <th>Œuvre</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>Artiste</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>Factory</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLoading = loadingItemId === item.id
                  const smartContract = item.nftResource?.collection?.smartContract || null;
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => !loadingItemId && handleItemClick(item.id)}
                      className={`clickable-row ${isLoading ? 'loading-row' : ''} ${loadingItemId && !isLoading ? 'disabled-row' : ''}`}
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
                    </tr>
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