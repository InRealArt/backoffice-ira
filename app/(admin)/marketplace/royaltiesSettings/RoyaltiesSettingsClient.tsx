'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { Item, ResourceNftStatuses, ResourceTypes, SmartContract } from '@prisma/client'
import { formatChainName } from '@/lib/blockchain/chainUtils'

// Importez ou créez un fichier CSS pour les styles
import styles from './RoyaltiesSettingsClient.module.scss'

// Modification du type pour inclure les informations sur la collection et le smart contract
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
    // Navigation vers une page de détail où les royalties peuvent être modifiées
    router.push(`/marketplace/royaltiesSettings/${itemId}/edit`)
  }
  
  // Fonction pour tronquer l'adresse du contrat
  function truncateAddress(address: string): string {
    if (!address) return 'Non défini'
    if (address.length <= 16) return address
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
  }
  
  // Fonction pour obtenir le badge en fonction du statut de la ressource NFT
  const getNftResourceStatusBadge = (status: ResourceNftStatuses) => {
    // Jaune pour MINED
    if (status === 'MINED') {
      return <span className={`${styles.statusBadge} ${styles.minedBadge}`}>{status}</span>
    }
    
    // Défaut pour les autres statuts (bien que normalement on n'aura que MINED ici)
    return <span className={`${styles.statusBadge} ${styles.defaultBadge}`}>{status}</span>
  }
  
  // Filtrer les items en fonction du smart contract sélectionné
  const filteredItems = selectedSmartContractId
    ? items.filter(item => 
        item.nftResource?.collection?.smartContractId === selectedSmartContractId
      )
    : items
  
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
                  {formatChainName(smartContract.network)} - {truncateAddress(smartContract.factoryAddress)}
                  {' '}
                  {smartContract.active ? '(Actif)' : '(Inactif)'}
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
                  <th className={styles.hiddenMobile}>Réseau</th>
                  <th className={styles.hiddenMobile}>Factory</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLoading = loadingItemId === item.id
                  const smartContract = item.nftResource?.collection?.smartContractId 
                    ? smartContracts.find(sc => sc.id === item.nftResource?.collection.smartContractId)
                    : null;
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
                          <div className={styles.factoryBadge}>
                            {formatChainName(smartContract.network)}
                          </div>
                        ) : (
                          <div className={`${styles.factoryBadge} ${styles.inactiveBadge}`}>
                            Inactif
                          </div>
                        )}
                      </td>
                      <td className={styles.hiddenMobile}>
                        {smartContract ? (
                          <div className={styles.factoryAddressCell}>
                            <span className={styles.truncatedAddress} title={smartContract.factoryAddress}>
                              {truncateAddress(smartContract.factoryAddress)}
                            </span>
                            <span className={`${styles.contractStatusBadge} ${smartContract.active ? styles.activeBadge : styles.inactiveBadge}`}>
                              {smartContract.active ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        ) : (
                          <div className={styles.factoryAddressCell}>
                            <span className={`${styles.contractStatusBadge} ${styles.inactiveBadge}`}>
                              Inactif
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className={styles.statusCell}>
                          {getNftResourceStatusBadge(item.nftResource?.status || 'MINED')}
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