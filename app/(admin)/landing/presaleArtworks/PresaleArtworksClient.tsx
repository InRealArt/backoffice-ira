'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Artist } from '@prisma/client'

// Type pour les artistes du filtre (retourné par getAllArtists)
type FilterArtist = {
  id: number
  name: string
  surname: string
  pseudo: string
  description: string
  publicKey: string
  imageUrl: string
  isGallery: boolean
  backgroundImage: string | null
  backofficeUserId: number | null
}
import Image from 'next/image'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useToast } from '@/app/components/Toast/ToastContext' 
import { deletePresaleArtwork } from '@/lib/actions/presale-artwork-actions'
import { Filters, FilterItem } from '@/app/components/Common'
import { useQueryStates } from 'nuqs'
import { presaleArtworksSearchParams } from './searchParams'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  DeleteActionButton,
  Column
} from '../../../components/PageLayout/index'
import styles from '../../../styles/list-components.module.scss'

function ImageThumbnail({ url }: { url: string }) {
  return (
    <div className={styles.thumbnailContainer}>
      <Image
        src={url}
        alt="Miniature"
        fill
        className="object-cover"
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
  width: number | null
  height: number | null
  artistId: number
  artist: Artist
  imageUrl: string
}

interface PresaleArtworksClientProps {
  presaleArtworks: PresaleArtwork[]
  totalItems: number
  currentPage: number
  itemsPerPage: number
  selectedArtistId: number | null
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  allArtists: FilterArtist[]
}

export default function PresaleArtworksClient({ 
  presaleArtworks, 
  totalItems, 
  currentPage: initialCurrentPage, 
  itemsPerPage: initialItemsPerPage, 
  selectedArtistId: initialSelectedArtistId, 
  sortColumn: initialSortColumn, 
  sortDirection: initialSortDirection,
  allArtists
}: PresaleArtworksClientProps) {
  const router = useRouter()
  const [loadingArtworkId, setLoadingArtworkId] = useState<number | null>(null)
  
  // Utiliser Nuqs pour gérer les paramètres de recherche
  const [searchParams, setSearchParams] = useQueryStates(presaleArtworksSearchParams, {
    shallow: false // Permettre la mise à jour côté serveur
  })
  
  const { success, error } = useToast()

  const handleArtworkClick = (artwork: PresaleArtwork) => {
    setLoadingArtworkId(artwork.id)
    // Navigation simple vers l'édition - l'historique du navigateur gère le retour
    router.push(`/landing/presaleArtworks/${artwork.id}/edit`)
  }

  const handleAddNewArtwork = () => {
    // Navigation simple vers la création - l'historique du navigateur gère le retour
    router.push(`/landing/presaleArtworks/create`)
  }

  const handleBulkAdd = () => {
    // Navigation vers la page d'ajout en masse
    router.push(`/landing/presaleArtworks/bulk-add`)
  }

  const handleDelete = async (artworkId: number) => {
    try {
      const result = await deletePresaleArtwork(artworkId)
      
      if (result.success) {
        success('Œuvre en prévente supprimée avec succès')
        router.refresh()
      } else {
        error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      error('Une erreur est survenue lors de la suppression')
    }
  }
  
  // Formater le prix en euros
  const formatPrice = (price: number | null) => {
    if (price === null) return 'Non défini'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
  }
  
  // Utiliser la liste complète des artistes passée en props
  const artists = allArtists
  
  // Fonction pour gérer le tri
  const handleSort = (column: string) => {
    if (searchParams.sortColumn === column) {
      setSearchParams({
        sortDirection: searchParams.sortDirection === 'asc' ? 'desc' : 'asc',
        page: 1 // Réinitialiser à la première page lors du tri
      })
    } else {
      setSearchParams({
        sortColumn: column,
        sortDirection: 'asc',
        page: 1 // Réinitialiser à la première page lors du tri
      })
    }
  }

  // Gestion des changements de pagination
  const handlePageChange = (page: number) => {
    setSearchParams({ page })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setSearchParams({ 
      itemsPerPage: newItemsPerPage,
      page: 1 // Réinitialiser à la première page
    })
  }

  // Gestion du changement de filtre artiste
  const handleArtistFilterChange = (value: string) => {
    setSearchParams({
      artistId: value ? parseInt(value) : null,
      page: 1 // Réinitialiser à la première page lors du filtrage
    })
  }
  
  // Fonction pour formater les dimensions
  const formatDimensions = (width: number | null, height: number | null) => {
    if (!width && !height) return '-'
    if (!width) return `- x ${height} cm`
    if (!height) return `${width} x - cm`
    return `${width} x ${height} cm`
  }

  // Définition des colonnes pour le DataTable
  const columns: Column<PresaleArtwork>[] = [
    {
      key: 'imageUrl',
      header: 'Image',
      width: '50px',
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
      key: 'dimensions',
      header: 'Dimensions',
      width: '120px',
      render: (artwork) => formatDimensions(artwork.width, artwork.height)
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
        <DeleteActionButton
          onDelete={() => handleDelete(artwork.id)}
          disabled={loadingArtworkId !== null}
          itemName={`l'œuvre "${artwork.name}"`}
          confirmMessage={`Êtes-vous sûr de vouloir supprimer l'œuvre "${artwork.name}" ? Cette action est irréversible.`}
        />
      )
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Œuvres en prévente"
        subtitle="Gérez les œuvres disponibles en prévente"
        actions={
          <div className="d-flex gap-sm">
            <ActionButton 
              label="Ajouter en masse"
              onClick={handleBulkAdd}
              size="small"
              variant="secondary"
            />
            <ActionButton 
              label="Ajouter une œuvre"
              onClick={handleAddNewArtwork}
              size="small"
            />
          </div>
        }
      />
      
      <Filters>
        <FilterItem
          id="artistFilter"
          label="Filtrer par artiste:"
          value={searchParams.artistId ? searchParams.artistId.toString() : ''}
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
          data={presaleArtworks}
          columns={columns}
          keyExtractor={(artwork) => artwork.id}
          onRowClick={handleArtworkClick}
          isLoading={false}
          loadingRowId={loadingArtworkId}
          sortColumn={searchParams.sortColumn}
          sortDirection={searchParams.sortDirection}
          onSort={handleSort}
          pagination={{
            enabled: true,
            currentPage: searchParams.page,
            itemsPerPage: searchParams.itemsPerPage,
            totalItems: totalItems,
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
    </PageContainer>
  )
} 