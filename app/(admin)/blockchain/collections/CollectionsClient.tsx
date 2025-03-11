'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Collection, Artist, SmartContract } from '@prisma/client'
import styles from './CollectionsClient.module.scss'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { formatChainName } from '@/lib/blockchain/chainUtils'

interface CollectionWithRelations extends Collection {
  artist: Artist
  smartContract: SmartContract | null
}

interface CollectionsClientProps {
  collections: CollectionWithRelations[]
  smartContracts: SmartContract[]
}

export default function CollectionsClient({ collections, smartContracts }: CollectionsClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingCollectionId, setLoadingCollectionId] = useState<number | null>(null)
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
  
  const handleCollectionClick = (collectionId: number) => {
    setLoadingCollectionId(collectionId)
    router.push(`/blockchain/collections/${collectionId}/edit`)
  }
  
  const handleCreateCollection = () => {
    router.push('/blockchain/collections/create')
  }
  
  // Fonction pour tronquer l'adresse du contrat
  function truncateAddress(address: string): string {
    if (address.length <= 16) return address
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
  }
  
  // Filtrer les collections en fonction de la factory sélectionnée
  const filteredCollections = selectedSmartContractId
    ? collections.filter(collection => collection.smartContractId === selectedSmartContractId)
    : collections
      
  return (
    <div className={styles.collectionsContainer}>
      <div className={styles.collectionsHeader}>
        <div className={styles.headerTopSection}>
          <h1 className={styles.pageTitle}>Collections</h1>
          <button 
            onClick={handleCreateCollection}
            className={styles.createButton}
          >
            Créer une collection de NFT
          </button>
        </div>
        <p className={styles.subtitle}>
          Liste des collections enregistrées dans le système
        </p>
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
              <option value="">Toutes les smart contracts</option>
              {smartContracts.map(smartContract => (
                <option key={smartContract.id} value={smartContract.id}>
                  {formatChainName(smartContract.network)} - (Factory address) {truncateAddress(smartContract.factoryAddress)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className={styles.collectionsContent}>
        {filteredCollections.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucune collection trouvée</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.collectionsTable}>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Artiste</th>
                  <th className={styles.hiddenMobile}>Factory</th>
                  <th className={styles.hiddenMobile}>Réseau</th>
                  <th className={styles.hiddenMobile}>Adresse du contrat</th>
                  <th className={styles.hiddenMobile}>Admin</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollections.map((collection) => {
                  const isLoading = loadingCollectionId === collection.id
                  return (
                    <tr 
                      key={collection.id} 
                      onClick={() => !loadingCollectionId && handleCollectionClick(collection.id)}
                      className={`${styles.clickableRow} ${isLoading ? styles.loadingRow : ''} ${loadingCollectionId && !isLoading ? styles.disabledRow : ''}`}
                    >
                      <td>
                        <div className={styles.symbolCell}>
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? styles.loadingText : ''}>
                            {collection.symbol}
                          </span>
                        </div>
                      </td>
                      <td>{collection.artist.pseudo}</td>
                      <td className={styles.hiddenMobile}>
                        {collection.smartContract ? (
                          <div className={styles.truncatedAddress}>
                            {formatChainName(collection.smartContract.factoryAddress)}
                          </div>
                          
                        ) : (
                          <span className={styles.noFactory}>Non défini</span>
                        )}
                      </td>
                      <td className={styles.hiddenMobile}>
                        {collection.smartContract ? (
                          <div className={styles.factoryBadge}>
                            {formatChainName(collection.smartContract.network)}
                          </div>
                          
                        ) : (
                          <span className={styles.noFactory}>Non défini</span>
                        )}
                      </td>
                      <td className={styles.hiddenMobile}>
                        <span className={styles.truncatedAddress} title={collection.contractAddress as string}>
                          {truncateAddress(collection.contractAddress as string)}
                        </span>
                      </td>
                      <td className={styles.hiddenMobile}>
                        <span className={styles.truncatedAddress} title={collection.addressAdmin}>
                          {truncateAddress(collection.addressAdmin)}
                        </span>
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