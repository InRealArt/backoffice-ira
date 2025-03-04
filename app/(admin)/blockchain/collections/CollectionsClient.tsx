'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Collection, Artist } from '@prisma/client'
import styles from './CollectionsClient.module.scss'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'

interface CollectionWithArtist extends Collection {
  artist: Artist
}

interface CollectionsClientProps {
  collections: CollectionWithArtist[]
}

export default function CollectionsClient({ collections }: CollectionsClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingCollectionId, setLoadingCollectionId] = useState<number | null>(null)
  
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
  
  // Fonction pour tronquer l'adresse du contrat
  function truncateAddress(address: string): string {
    if (address.length <= 16) return address
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
  }
  
  return (
    <div className={styles.collectionsContainer}>
      <div className={styles.collectionsHeader}>
        <h1 className={styles.pageTitle}>Collections</h1>
        <p className={styles.subtitle}>
          Liste des collections enregistrées dans le système
        </p>
      </div>
      
      <div className={styles.collectionsContent}>
        {collections.length === 0 ? (
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
                  <th className={styles.hiddenMobile}>Adresse du contrat</th>
                  <th className={styles.hiddenMobile}>Admin</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((collection) => {
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
                        <span className={styles.truncatedAddress} title={collection.contractAddress}>
                          {truncateAddress(collection.contractAddress)}
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