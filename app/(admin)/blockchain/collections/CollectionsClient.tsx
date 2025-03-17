'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Collection, Artist, SmartContract } from '@prisma/client'
import styles from './CollectionsClient.module.scss'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { formatChainName } from '@/lib/blockchain/chainUtils'
import Modal from '@/app/components/Common/Modal'
import { getAuthToken } from '@dynamic-labs/sdk-react-core' 

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
  const [deletingCollectionId, setDeletingCollectionId] = useState<number | null>(null)
  const [selectedSmartContractId, setSelectedSmartContractId] = useState<number | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState<number | null>(null)
  
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
  
  const handleDeleteClick = (e: React.MouseEvent, collectionId: number) => {
    e.stopPropagation() // Empêche le déclenchement du clic de ligne
    setCollectionToDelete(collectionId)
    setIsDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!collectionToDelete) return
    
    setIsDeleteModalOpen(false)
    setDeletingCollectionId(collectionToDelete)
    
    console.log('Suppression de la collection:', collectionToDelete)
    // Récupérer le token côté client
    const token = getAuthToken()

    try {
      const response = await fetch(`/api/blockchain/collections/delete/${collectionToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        // Rafraîchir la page pour voir les changements
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Erreur lors de la suppression: ${error.message || 'Une erreur est survenue'}`)
      }
    } catch (error) {
      alert('Erreur lors de la suppression de la collection')
      console.error(error)
    } finally {
      setDeletingCollectionId(null)
      setCollectionToDelete(null)
    }
  }
  
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setCollectionToDelete(null)
  }
  
  const handleCreateCollection = () => {
    router.push('/blockchain/collections/create')
  }
  
  // Fonction pour tronquer l'adresse du contrat
  function truncateAddress(address: string): string {
    if (!address) return 'Non défini'
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
                  {formatChainName(smartContract.network)}
                  (Factory address) {truncateAddress(smartContract.factoryAddress)}
                  &nbsp;{smartContract.active ? '🟢 ' : '🔴 '}
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
                  <th className={styles.hiddenMobile}>Adresse de la factoryt</th>
                  <th className={styles.hiddenMobile}>Admin</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollections.map((collection) => {
                  const isLoading = loadingCollectionId === collection.id
                  const isDeleting = deletingCollectionId === collection.id
                  return (
                    <tr 
                      key={collection.id} 
                      onClick={() => !loadingCollectionId && !deletingCollectionId && handleCollectionClick(collection.id)}
                      className={`${styles.clickableRow} ${isLoading || isDeleting ? styles.loadingRow : ''} ${(loadingCollectionId || deletingCollectionId) && !isLoading && !isDeleting ? styles.disabledRow : ''}`}
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
                          <div className={styles.factoryWithStatus}>
                            <div className={styles.truncatedAddress}>
                              {formatChainName(collection.smartContract.factoryAddress)}
                            </div>
                            <span className={collection.smartContract.active 
                              ? styles.statusBadgeActive 
                              : styles.statusBadgeInactive}>
                              {collection.smartContract.active ? 'Actif' : 'Inactif'}
                            </span>
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
                      <td className={styles.actionsCell}>
                        <button
                          className={styles.deleteButton}
                          onClick={(e) => handleDeleteClick(e, collection.id)}
                          disabled={isLoading || isDeleting || !!loadingCollectionId || !!deletingCollectionId}
                        >
                          {isDeleting && deletingCollectionId === collection.id ? (
                            <LoadingSpinner size="small" message="" inline />
                          ) : (
                            <span>Supprimer</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        title="Confirmer la suppression"
      >
        <div className={styles.deleteModalContent}>
          <p>Êtes-vous sûr de vouloir supprimer cette collection (id: {collectionToDelete})?</p>
          <p className={styles.deleteModalWarning}>Cette action est irréversible.</p>
          
          <div className={styles.deleteModalActions}>
            <button 
              className={styles.cancelButton}
              onClick={handleDeleteCancel}
            >
              Annuler
            </button>
            <button 
              className={styles.confirmDeleteButton}
              onClick={handleDeleteConfirm}
            >
              Confirmer la suppression
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
} 