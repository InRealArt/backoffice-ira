'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { Item, ResourceNftStatuses, ResourceTypes, SmartContract } from '@prisma/client'
import { formatChainName } from '@/lib/blockchain/chainUtils'
import NftStatusBadge from '@/app/components/Nft/NftStatusBadge'
import { getActiveBadge } from '@/app/components/StatusBadge/StatusBadge'
import BlockchainAddress from '@/app/components/blockchain/BlockchainAddress'

// Importez ou créez un fichier CSS pour les styles
import styles from './RoyaltiesSettingsClient.module.scss'
import { truncateAddress } from '@/lib/blockchain/utils'

// Modification du type pour inclure le smartContractId
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
      smartContractId: number | null  // Ajout de smartContractId
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
  
  // Dans le code de debugging
  useEffect(() => {
    if (selectedSmartContractId) {
      console.log('Smart Contract ID sélectionné:', selectedSmartContractId);
      items.forEach(item => {
        // Vérifier à la fois smartContractId et smartContract.id
        const collectionSmartContractId = item.nftResource?.collection?.smartContractId;
        const smartContractId = item.nftResource?.collection?.smartContract?.id;
        console.log(`Item ${item.id}, Collection smartContractId: ${collectionSmartContractId}, SmartContract.id: ${smartContractId}`);
      });
    }
  }, [selectedSmartContractId, items]);
  
  // Amélioration du filtrage
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
    <div className={styles.productsContainer}>
      <div className={styles.productsHeader}>
        <div>
          <h1 className={styles.pageTitle}>Configuration des royalties</h1>
          <p className={styles.subtitle}>
            Gérez les paramètres de royalties pour les œuvres mintées
          </p>
        </div>
      </div>
      
      <div className={styles.filterSection}>
        <div className={styles.filterItem}>
          <label htmlFor="smartContractFilter" className={styles.filterLabel}>
            Filtrer par smart contract:
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="smartContractFilter"
              className={styles.filterSelect}
              value={selectedSmartContractId || ''}
              onChange={(e) => setSelectedSmartContractId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Tous les smart contracts</option>
              {smartContracts.map(smartContract => (
                <option key={smartContract.id} value={smartContract.id}>
                  {smartContract.active ? '🟢 ' : '🔴 '} {formatChainName(smartContract.network)} - {truncateAddress(smartContract.factoryAddress)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className={styles.productsContent}>
        {!filteredItems.length ? (
          <div className={styles.emptyState}>
            <p>Aucune œuvre mintée disponible</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.productsTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th className={styles.hiddenMobile}>Token ID</th>
                  <th>Œuvre</th>
                  <th className={styles.hiddenMobile}>Artiste</th>
                  <th className={styles.hiddenMobile}>Factory</th>
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
                      className={`${styles.clickableRow} ${isLoading ? styles.loadingRow : ''} ${loadingItemId && !isLoading ? styles.disabledRow : ''}`}
                    >
                      <td>
                        <div className={styles.idCell}>
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? styles.loadingText : ''}>
                            {item.id}
                          </span>
                        </div>
                      </td>
                      <td className={styles.hiddenMobile}>
                        {item.nftResource?.tokenId || 'N/A'}
                      </td>
                      <td>
                        {item.nftResource?.name}
                      </td>
                      <td className={styles.hiddenMobile}>
                        {item.user ? 
                          `${item.user.firstName || ''} ${item.user.lastName || ''} ${item.user.email ? `(${item.user.email})` : ''}`.trim() : 
                          'N/A'
                        }
                      </td>
                      <td className={styles.hiddenMobile}>
                        {smartContract ? (
                          <div className={styles.smartContractCell}>
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
                        <div className={styles.statusCell}>
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