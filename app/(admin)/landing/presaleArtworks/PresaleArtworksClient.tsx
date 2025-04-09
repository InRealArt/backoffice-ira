'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Artist } from '@prisma/client'
import Image from 'next/image'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { toast } from 'react-hot-toast'
import Modal from '@/app/components/Common/Modal'
import { deletePresaleArtwork } from '@/lib/actions/presale-artwork-actions'
import { Filters, FilterItem } from '@/app/components/Common'

function ImageThumbnail({ url }: { url: string }) {
  return (
    <div className="relative w-6 h-6">
      <Image
        src={url}
        alt="Miniature"
        width={24}
        height={24}
        className="object-cover rounded-sm"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}

interface PresaleArtwork {
  id: number
  name: string
  order: number
  price: number
  artistId: number
  artist: Artist
  imageUrl: string
}

interface PresaleArtworksClientProps {
  presaleArtworks: PresaleArtwork[]
}

export default function PresaleArtworksClient({ presaleArtworks }: PresaleArtworksClientProps) {
  const router = useRouter()
  const [loadingArtworkId, setLoadingArtworkId] = useState<number | null>(null)
  const [deletingArtworkId, setDeletingArtworkId] = useState<number | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [artworkToDelete, setArtworkToDelete] = useState<number | null>(null)
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null)

  const handleArtworkClick = (artworkId: number) => {
    setLoadingArtworkId(artworkId)
    router.push(`/landing/presaleArtworks/${artworkId}/edit`)
  }

  const handleAddNewArtwork = () => {
    router.push(`/landing/presaleArtworks/create`)
  }

  const handleDeleteClick = (e: React.MouseEvent, artworkId: number) => {
    e.stopPropagation()
    setArtworkToDelete(artworkId)
    setIsDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!artworkToDelete) return
    
    setIsDeleteModalOpen(false)
    setDeletingArtworkId(artworkToDelete)
    
    try {
      const result = await deletePresaleArtwork(artworkToDelete)
      
      if (result.success) {
        toast.success('Œuvre en prévente supprimée avec succès')
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Une erreur est survenue lors de la suppression')
    } finally {
      setDeletingArtworkId(null)
      setArtworkToDelete(null)
    }
  }
  
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setArtworkToDelete(null)
  }
  
  // Formater le prix en euros
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
  }
  
  // Obtenir la liste unique des artistes à partir des œuvres
  const artists = Array.from(
    new Map(
      presaleArtworks.map(artwork => [
        artwork.artistId,
        artwork.artist
      ])
    ).values()
  )
  
  // Filtrer les œuvres en fonction de l'artiste sélectionné
  const filteredArtworks = selectedArtistId
    ? presaleArtworks.filter(artwork => artwork.artistId === selectedArtistId)
    : presaleArtworks
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Œuvres en prévente</h1>
          <button 
            className="btn btn-primary btn-small"
            onClick={handleAddNewArtwork}
          >
            Ajouter une œuvre
          </button>
        </div>
        <p className="page-subtitle">
          Gérez les œuvres disponibles en prévente
        </p>
      </div>
      
      <Filters>
        <FilterItem
          id="artistFilter"
          label="Filtrer par artiste:"
          value={selectedArtistId ? selectedArtistId.toString() : ''}
          onChange={(value) => setSelectedArtistId(value ? parseInt(value) : null)}
          options={[
            { value: '', label: 'Tous les artistes' },
            ...artists.map(artist => ({
              value: artist.id.toString(),
              label: `${artist.name} ${artist.surname}`
            }))
          ]}
        />
      </Filters>
      
      <div className="page-content">
        {filteredArtworks.length === 0 ? (
          <div className="empty-state">
            <p>Aucune œuvre en prévente trouvée</p>
            <button 
              className="btn btn-primary btn-medium mt-4"
              onClick={handleAddNewArtwork}
            >
              Ajouter une œuvre en prévente
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Ordre</th>
                  <th>Nom</th>
                  <th>Artiste</th>
                  <th>Prix</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArtworks.map((artwork) => {
                  const isLoading = loadingArtworkId === artwork.id
                  const isDeleting = deletingArtworkId === artwork.id
                  const isDisabled = loadingArtworkId !== null || deletingArtworkId !== null
                  
                  return (
                    <tr 
                      key={artwork.id} 
                      onClick={() => !isDisabled && handleArtworkClick(artwork.id)}
                      className={`clickable-row ${isLoading || isDeleting ? 'loading-row' : ''} ${isDisabled && !isLoading && !isDeleting ? 'disabled-row' : ''}`}
                    >
                      <td className="w-8">
                        <ImageThumbnail url={artwork.imageUrl} />
                      </td>
                      <td>
                        {artwork.order}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? 'text-muted' : ''}>
                            {artwork.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        {artwork.artist.name} {artwork.artist.surname}
                      </td>
                      <td>
                        {formatPrice(artwork.price)}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={(e) => handleDeleteClick(e, artwork.id)}
                          className="btn btn-danger btn-small"
                          disabled={isDisabled}
                        >
                          {isDeleting ? (
                            <LoadingSpinner size="small" message="" inline />
                          ) : (
                            'Supprimer'
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
        title="Confirmation de suppression"
      >
        <div className="modal-content">
          <p className="text-danger">
            Êtes-vous sûr de vouloir supprimer cette œuvre en prévente ? Cette action est irréversible.
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