'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Collection, Artist, SmartContract } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { formatChainName } from '@/lib/blockchain/chainUtils'
import { Filters, FilterItem } from '@/app/components/Common'
import { getAuthToken } from '@dynamic-labs/sdk-react-core' 
import { truncateAddress } from '@/lib/blockchain/utils'
import BlockchainAddress from '@/app/components/blockchain/BlockchainAddress'
import Modal from '@/app/components/Common/Modal'
import { StatusRow } from '@/app/components/Table'
import { getActiveBadge } from '@/app/components/StatusBadge/StatusBadge'

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
  
  // Filtrer les collections en fonction de la factory sélectionnée
  const filteredCollections = selectedSmartContractId
    ? collections.filter(collection => collection.smartContractId === selectedSmartContractId)
    : collections
      
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Collections</h1>
          <button 
            onClick={handleCreateCollection}
            className="btn btn-primary btn-medium"
          >
            Créer une collection de NFT
          </button>
        </div>
        <p className="page-subtitle">
          Liste des collections enregistrées dans le système
        </p>
      </div>
      
      <Filters>
        <FilterItem
          id="smartContractFilter"
          label="Filtrer par smart contract:"
          value={selectedSmartContractId ? selectedSmartContractId.toString() : ''}
          onChange={(value) => setSelectedSmartContractId(value ? parseInt(value) : null)}
          options={[
            { value: '', label: 'Toutes les smart contracts' },
            ...smartContracts.map(smartContract => ({
              value: smartContract.id.toString(),
              label: `${formatChainName(smartContract.network)} (Factory) ${truncateAddress(smartContract.factoryAddress)} ${smartContract.active ? '🟢 ' : '🔴 '}`
            }))
          ]}
        />
      </Filters>
      
      <div className="page-content">
        {filteredCollections.length === 0 ? (
          <div className="empty-state">
            <p>Aucune collection trouvée</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Artiste</th>
                  <th className="hidden-mobile">Factory</th>
                  <th className="hidden-mobile">Réseau</th>
                  <th className="hidden-mobile">Adresse de la collection NFT</th>
                  <th className="hidden-mobile">Admin</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollections.map((collection) => {
                  const isLoading = loadingCollectionId === collection.id
                  const isDeleting = deletingCollectionId === collection.id
                  const isSmartContractActive = collection.smartContract?.active ?? true;
                  
                  return (
                    <StatusRow 
                      key={collection.id} 
                      isActive={isSmartContractActive}
                      colorType="danger"
                      onClick={() => !loadingCollectionId && !deletingCollectionId && handleCollectionClick(collection.id)}
                      className={`clickable-row ${isLoading || isDeleting ? 'loading-row' : ''} ${(loadingCollectionId || deletingCollectionId) && !isLoading && !isDeleting ? 'disabled-row' : ''}`}
                    >
                      {/* Symbol */}
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? 'text-muted' : ''}>
                            {collection.symbol}
                          </span>
                        </div>
                      </td>
                      {/* Artiste */}
                      <td>{collection.artist.pseudo}</td>
                      {/* Factory */}
                      <td className="hidden-mobile">
                        {collection.smartContract ? (
                          <div className="d-flex flex-column gap-xs">
                            <BlockchainAddress 
                              address={collection.smartContract.factoryAddress} 
                              network={collection.smartContract.network}
                              showExplorerLink={true}
                            />
                            <div className="d-flex">
                              {getActiveBadge(collection.smartContract.active, 'badge-small')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted">Non défini</span>
                        )}
                      </td>
                      {/* Réseau */}
                      <td className="hidden-mobile">
                        {collection.smartContract ? (
                          <div className="info-badge">
                            {formatChainName(collection.smartContract.network)}
                          </div>
                          
                        ) : (
                          <span className="text-muted">Non défini</span>
                        )}
                      </td>
                      {/* Adresse de la collection */}
                      <td className="hidden-mobile">
                        {collection.contractAddress ? (
                          <BlockchainAddress 
                            address={collection.contractAddress} 
                            network={collection.smartContract?.network || 'sepolia'}
                            showExplorerLink={true}
                          />
                        ) : (
                          <span className="text-muted">Non défini</span>
                        )}
                      </td>
                      <td className="hidden-mobile">
                        <BlockchainAddress 
                          address={collection.addressAdmin} 
                          network={collection.smartContract?.network || 'sepolia'}
                        />
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn btn-danger btn-small"
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
                    </StatusRow>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        title="Confirmation de suppression"
      >
        <div className="modal-content">
          <p className="text-danger">
            Êtes-vous sûr de vouloir supprimer cette collection ? Cette action est irréversible.
          </p>
          
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={handleDeleteCancel}>
              Annuler
            </button>
            <button className="btn btn-danger" onClick={handleDeleteConfirm}>
              Confirmer la suppression
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
} 