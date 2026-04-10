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
import { deleteGalleryLjArtist } from '@/lib/actions/gallery-lj-artist-actions'
import { getImageUrl } from '@/lib/r2/url'
import { ArrowUpDown } from 'lucide-react'

interface GalleryLjArtistRow {
  id: number
  pseudo: string
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
  visible: boolean
  order: number
  createdAt: Date
  artworks: { id: number }[]
}

interface GalleryLjArtistsClientProps {
  artists: GalleryLjArtistRow[]
  totalItems: number
  currentPage: number
  itemsPerPage: number
  sortColumn: string
  sortDirection: 'asc' | 'desc'
}

export default function GalleryLjArtistsClient({
  artists: initialArtists,
  totalItems,
  currentPage,
  itemsPerPage,
  sortColumn,
  sortDirection
}: GalleryLjArtistsClientProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) || 'fr'
  const { success, error: showError } = useToast()
  const [artists, setArtists] = useState(initialArtists)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const result = await deleteGalleryLjArtist(id)
      if (result.success) {
        setArtists((prev) => prev.filter((a) => a.id !== id))
        success('Artiste supprimé avec succès')
      } else {
        showError(result.message ?? 'Erreur lors de la suppression')
      }
    } catch {
      showError('Erreur inattendue lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  const handleRowClick = (artist: GalleryLjArtistRow) => {
    router.push(`/${locale}/galleryLj/artists/${artist.id}/edit`)
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', String(page))
    router.push(`?${params.toString()}`)
  }

  const handleSort = (column: string) => {
    const params = new URLSearchParams(window.location.search)
    const newDirection =
      sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    params.set('sortColumn', column)
    params.set('sortDirection', newDirection)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const columns: Column<GalleryLjArtistRow>[] = [
    {
      key: 'order',
      header: 'Ordre',
      width: '70px',
      render: (artist) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold">
          {artist.order}
        </span>
      )
    },
    {
      key: 'id',
      header: 'ID',
      width: '60px',
      render: (artist) => <span>{artist.id}</span>
    },
    {
      key: 'image',
      header: 'Photo',
      width: '60px',
      render: (artist) => {
        const url = getImageUrl(artist.imageUrl)
        if (!url) return <span className="text-text-muted text-sm">-</span>
        return (
          <div className="relative w-10 h-10 rounded overflow-hidden">
            <Image
              src={url}
              alt={artist.pseudo}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        )
      }
    },
    {
      key: 'pseudo',
      header: 'Pseudo',
      render: (artist) => (
        <span className="font-medium">{artist.pseudo}</span>
      )
    },
    {
      key: 'firstName',
      header: 'Prénom',
      render: (artist) => <span>{artist.firstName ?? '-'}</span>
    },
    {
      key: 'lastName',
      header: 'Nom',
      render: (artist) => <span>{artist.lastName ?? '-'}</span>
    },
    {
      key: 'artworks',
      header: 'Œuvres',
      width: '80px',
      render: (artist) => <span>{artist.artworks.length}</span>
    },
    {
      key: 'visible',
      header: 'Visible',
      width: '80px',
      render: (artist) => (
        <span
          className={`badge ${artist.visible ? 'badge-success' : 'badge-secondary'}`}
        >
          {artist.visible ? 'Oui' : 'Non'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: (artist) => (
        <DeleteActionButton
          onDelete={() => handleDelete(artist.id)}
          disabled={deletingId !== null}
          itemName={`l'artiste "${artist.pseudo}"`}
          confirmMessage={`Êtes-vous sûr de vouloir supprimer l'artiste "${artist.pseudo}" ? Toutes ses œuvres seront également supprimées.`}
        />
      )
    }
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Artistes — Galerie LJ"
        subtitle="Gérez les artistes exposés dans la galerie LJ"
        actions={
          <div className="flex gap-2">
            <ActionButton
              label="Modifier l'ordre"
              onClick={() => router.push(`/${locale}/galleryLj/artists/display-order`)}
              size="small"
              variant="secondary"
              icon={<ArrowUpDown size={16} />}
            />
            <ActionButton
              label="Ajouter un artiste"
              onClick={() => router.push(`/${locale}/galleryLj/artists/create`)}
              size="small"
            />
          </div>
        }
      />
      <PageContent>
        <DataTable
          data={artists}
          columns={columns}
          keyExtractor={(a) => a.id}
          onRowClick={handleRowClick}
          isLoading={false}
          loadingRowId={deletingId}
          emptyState={
            <EmptyState
              message="Aucun artiste trouvé"
              action={
                <ActionButton
                  label="Ajouter un artiste"
                  onClick={() => router.push(`/${locale}/galleryLj/artists/create`)}
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
