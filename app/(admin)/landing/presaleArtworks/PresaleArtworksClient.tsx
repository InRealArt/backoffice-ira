'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Artist } from '@prisma/client'
import Image from 'next/image'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useToast } from '@/app/components/Toast/ToastContext' 
import Modal from '@/app/components/Common/Modal'
import { deletePresaleArtwork } from '@/lib/actions/presale-artwork-actions'
import { Filters, FilterItem } from '@/app/components/Common'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  Column
} from '../../../components/PageLayout/index'

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
  price: number | null
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
  const [sortColumn, setSortColumn] = useState<string>('order')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  
  const { success, error } = useToast()

  const handleArtworkClick = (artwork: PresaleArtwork) => {
    setLoadingArtworkId(artwork.id)
    router.push(`/landing/presaleArtworks/${artwork.id}/edit`)
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
        success('Œuvre en prévente supprimée avec succès')
        router.refresh()
      } else {
        error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error)
      error('Une erreur est survenue lors de la suppression')
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
  const formatPrice = (price: number | null) => {
    if (price === null) return 'Non défini'
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
  
  // Fonction pour gérer le tri
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    // Réinitialiser à la première page lors du tri
    setCurrentPage(1)
  }
  
  // Filtrer les œuvres en fonction de l'artiste sélectionné
  const filteredArtworks = selectedArtistId
    ? presaleArtworks.filter(artwork => artwork.artistId === selectedArtistId)
    : presaleArtworks
  
  // Trier les œuvres selon le champ sélectionné
  const sortedArtworks = [...filteredArtworks].sort((a, b) => {
    const valueA = (a as any)[sortColumn] ?? 0
    const valueB = (b as any)[sortColumn] ?? 0
    
    if (sortDirection === 'asc') {
      return typeof valueA === 'string' 
        ? valueA.localeCompare(valueB) 
        : valueA - valueB
    } else {
      return typeof valueA === 'string' 
        ? valueB.localeCompare(valueA) 
        : valueB - valueA
    }
  })

  // Gestion des changements de pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Réinitialiser à la première page
  }

  // Gestion du changement de filtre artiste
  const handleArtistFilterChange = (value: string) => {
    setSelectedArtistId(value ? parseInt(value) : null)
    setCurrentPage(1) // Réinitialiser à la première page lors du filtrage
  }
  
  // Définition des colonnes pour le DataTable
  const columns: Column<PresaleArtwork>[] = [
    {
      key: 'imageUrl',
      header: 'Image',
      width: '60px',
      render: (artwork) => <ImageThumbnail url={artwork.imageUrl} />
    },
    {
      key: 'order',
      header: 'Ordre',
      width: '80px',
      sortable: true
    },
    {
      key: 'name',
      header: 'Nom',
      sortable: true,
      render: (artwork) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingArtworkId === artwork.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingArtworkId === artwork.id ? 'text-muted' : ''}>
            {artwork.name}
          </span>
        </div>
      )
    },
    {
      key: 'artist',
      header: 'Artiste',
      render: (artwork) => `${artwork.artist.name} ${artwork.artist.surname}`
    },
    {
      key: 'price',
      header: 'Prix',
      sortable: true,
      render: (artwork) => formatPrice(artwork.price)
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (artwork) => (
        <button
          onClick={(e) => handleDeleteClick(e, artwork.id)}
          className="btn btn-danger btn-small"
          disabled={loadingArtworkId !== null || deletingArtworkId !== null}
        >
          {deletingArtworkId === artwork.id ? (
            <LoadingSpinner size="small" message="" inline />
          ) : (
            'Supprimer'
          )}
        </button>
      )
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Œuvres en prévente"
        subtitle="Gérez les œuvres disponibles en prévente"
        actions={
          <ActionButton 
            label="Ajouter une œuvre"
            onClick={handleAddNewArtwork}
            size="small"
          />
        }
      />
      
      <Filters>
        <FilterItem
          id="artistFilter"
          label="Filtrer par artiste:"
          value={selectedArtistId ? selectedArtistId.toString() : ''}
          onChange={handleArtistFilterChange}
          options={[
            { value: '', label: 'Tous les artistes' },
            ...artists.map(artist => ({
              value: artist.id.toString(),
              label: `${artist.name} ${artist.surname}`
            }))
          ]}
        />
      </Filters>
      
      <PageContent>
        <DataTable
          data={sortedArtworks}
          columns={columns}
          keyExtractor={(artwork) => artwork.id}
          onRowClick={handleArtworkClick}
          isLoading={false}
          loadingRowId={loadingArtworkId}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          pagination={{
            enabled: true,
            currentPage,
            itemsPerPage,
            totalItems: sortedArtworks.length,
            onPageChange: handlePageChange,
            onItemsPerPageChange: handleItemsPerPageChange,
            showItemsPerPage: true,
            itemsPerPageOptions: [10, 25, 50, 100]
          }}
          emptyState={
            <EmptyState 
              message="Aucune œuvre en prévente trouvée"
              action={
                <ActionButton
                  label="Ajouter une œuvre en prévente"
                  onClick={handleAddNewArtwork}
                  variant="primary"
                />
              }
            />
          }
        />
      </PageContent>
      
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
    </PageContainer>
  )
} 