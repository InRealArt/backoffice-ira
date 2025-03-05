'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Collection, Artist, Factory } from '@prisma/client'
import styles from './CollectionsClient.module.scss'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { formatChainName } from '@/lib/blockchain/chainUtils'

interface CollectionWithRelations extends Collection {
  artist: Artist
  factory: Factory | null
}

interface CollectionsClientProps {
  collections: CollectionWithRelations[]
  factories: Factory[]
}

export default function CollectionsClient({ collections, factories }: CollectionsClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingCollectionId, setLoadingCollectionId] = useState<number | null>(null)
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null)
  
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
  const filteredCollections = selectedFactoryId
    ? collections.filter(collection => collection.factoryId === selectedFactoryId)
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
          <label htmlFor="factoryFilter" className={styles.filterLabel}>
            Filtrer par factory:
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="factoryFilter"
              className={styles.filterSelect}
              value={selectedFactoryId || ''}
              onChange={(e) => setSelectedFactoryId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Toutes les factories</option>
              {factories.map(factory => (
                <option key={factory.id} value={factory.id}>
                  {formatChainName(factory.chain)} - {truncateAddress(factory.contractAddress)}
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
                        {collection.factory ? (
                          <div className={styles.factoryBadge}>
                            {formatChainName(collection.factory.chain)}
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