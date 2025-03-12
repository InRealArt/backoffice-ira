'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { Item, ResourceNftStatuses, ResourceTypes } from '@prisma/client'

// Importez ou créez un fichier CSS pour les styles
import styles from './RoyaltiesSettingsClient.module.scss'

// Modification du type pour correspondre exactement aux données renvoyées par Prisma
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
  } | null
}

interface RoyaltiesSettingsClientProps {
  minedItems: MinedItemWithRelations[]
}

export default function RoyaltiesSettingsClient({ minedItems = [] }: RoyaltiesSettingsClientProps) {
  const router = useRouter()
  const [items, setItems] = useState(minedItems)
  const [isMobile, setIsMobile] = useState(false)
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null)
  
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
  
  // Fonction pour obtenir le badge en fonction du statut de la ressource NFT
  const getNftResourceStatusBadge = (status: ResourceNftStatuses) => {
    // Jaune pour MINED
    if (status === 'MINED') {
      return <span className={`${styles.statusBadge} ${styles.minedBadge}`}>{status}</span>
    }
    
    // Défaut pour les autres statuts (bien que normalement on n'aura que MINED ici)
    return <span className={`${styles.statusBadge} ${styles.defaultBadge}`}>{status}</span>
  }
  
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
      
      <div className={styles.productsContent}>
        {!items.length ? (
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
                  <th className={styles.hiddenMobile}>Contrat</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isLoading = loadingItemId === item.id
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
                        <span className="truncate max-w-[150px] inline-block" title={'N/A'}>
                          {'N/A'}
                        </span>
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