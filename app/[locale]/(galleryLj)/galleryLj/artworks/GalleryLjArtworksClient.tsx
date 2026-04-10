'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useToast } from '@/app/components/Toast/ToastContext'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  DeleteActionButton,
  Column
} from '@/app/components/PageLayout/index'
import { deleteGalleryLjArtwork } from '@/lib/actions/gallery-lj-artwork-actions'
import { getImageUrl } from '@/lib/r2/url'

interface ArtistRef {
  id: number
  pseudo: string
  firstName: string | null
  lastName: string | null
}

interface GalleryLjArtworkRow {
  id: number
  name: string
  price: number | null
  dimensions: string | null
  creationYear: number | null
  imageUrl: string
  visible: boolean
  createdAt: Date
  artistId: number
  artist: ArtistRef
}

interface GalleryLjArtworksClientProps {
  artworks: GalleryLjArtworkRow[]
  totalItems: number
  currentPage: number
  itemsPerPage: number
  sortColumn: string
  sortDirection: 'asc' | 'desc'
}

function getArtistLabel(artist: ArtistRef): string {
  if (artist.firstName && artist.lastName) {
    return `${artist.firstName} ${artist.lastName}`
  }
  return artist.pseudo
}

export default function GalleryLjArtworksClient({
  artworks: initialArtworks,
  totalItems,
  currentPage,
  itemsPerPage,
  sortColumn,
  sortDirection
}: GalleryLjArtworksClientProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) || 'fr'
  const { success, error: showError } = useToast()
  const [artworks, setArtworks] = useState(initialArtworks)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const result = await deleteGalleryLjArtwork(id)
      if (result.success) {
        setArtworks((prev) => prev.filter((a) => a.id !== id))
        success('Œuvre supprimée avec succès')
      } else {
        showError(result.message ?? 'Erreur lors de la suppression')
      }
    } catch {
      showError('Erreur inattendue lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  const handleRowClick = (artwork: GalleryLjArtworkRow) => {
    router.push(`/${locale}/galleryLj/artworks/${artwork.id}/edit`)
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handlePageChange = (page: number) => {
    const urlParams = new URLSearchParams(window.location.search)
    urlParams.set('page', String(page))
    router.push(`?${urlParams.toString()}`)
  }

  const handleSort = (column: string) => {
    const urlParams = new URLSearchParams(window.location.search)
    const newDirection =
      sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    urlParams.set('sortColumn', column)
    urlParams.set('sortDirection', newDirection)
    urlParams.set('page', '1')
    router.push(`?${urlParams.toString()}`)
  }

  const columns: Column<GalleryLjArtworkRow>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '60px',
      render: (artwork) => <span>{artwork.id}</span>
    },
    {
      key: 'image',
      header: 'Image',
      width: '60px',
      render: (artwork) => {
        const url = getImageUrl(artwork.imageUrl)
        if (!url) return <span className="text-text-muted text-sm">-</span>
        return (
          <div className="relative w-10 h-10 rounded overflow-hidden">
            <Image
              src={url}
              alt={artwork.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        )
      }
    },
    {
      key: 'name',
      header: 'Titre',
      render: (artwork) => (
        <span className="font-medium">{artwork.name}</span>
      )
    },
    {
      key: 'artist',
      header: 'Artiste',
      render: (artwork) => <span>{getArtistLabel(artwork.artist)}</span>
    },
    {
      key: 'price',
      header: 'Prix',
      width: '100px',
      render: (artwork) => (
        <span>
          {artwork.price != null ? `${Number(artwork.price).toFixed(2)} €` : '-'}
        </span>
      )
    },
    {
      key: 'dimensions',
      header: 'Dimensions',
      width: '120px',
      render: (artwork) => <span>{artwork.dimensions ?? '-'}</span>
    },
    {
      key: 'creationYear',
      header: 'Année',
      width: '80px',
      render: (artwork) => <span>{artwork.creationYear ?? '-'}</span>
    },
    {
      key: 'visible',
      header: 'Visible',
      width: '80px',
      render: (artwork) => (
        <span
          className={`badge ${artwork.visible ? 'badge-success' : 'badge-secondary'}`}
        >
          {artwork.visible ? 'Oui' : 'Non'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: (artwork) => (
        <DeleteActionButton
          onDelete={() => handleDelete(artwork.id)}
          disabled={deletingId !== null}
          itemName={`l'œuvre "${artwork.name}"`}
          confirmMessage={`Êtes-vous sûr de vouloir supprimer l'œuvre "${artwork.name}" ?`}
        />
      )
    }
  ]

  // Suppress unused variable warning — handleSort is wired via DataTable onSort if available,
  // but kept here for parity with the artists pattern.
  void handleSort

  return (
    <PageContainer>
      <PageHeader
        title="Œuvres — Galerie LJ"
        subtitle="Gérez les œuvres exposées dans la galerie LJ"
        actions={
          <ActionButton
            label="Ajouter une œuvre"
            onClick={() => router.push(`/${locale}/galleryLj/artworks/create`)}
            size="small"
          />
        }
      />
      <PageContent>
        <DataTable
          data={artworks}
          columns={columns}
          keyExtractor={(a) => a.id}
          onRowClick={handleRowClick}
          isLoading={false}
          loadingRowId={deletingId}
          emptyState={
            <EmptyState
              message="Aucune œuvre trouvée"
              action={
                <ActionButton
                  label="Ajouter une œuvre"
                  onClick={() => router.push(`/${locale}/galleryLj/artworks/create`)}
                  variant="primary"
                />
              }
            />
          }
        />
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`px-3 py-1 rounded text-sm ${
                    p === currentPage
                      ? 'bg-primary text-white'
                      : 'bg-background-secondary text-text-main hover:bg-background-hover'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </PageContent>
    </PageContainer>
  )
}
