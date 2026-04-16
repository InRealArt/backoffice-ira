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
import { deleteGalleryLjExhibition } from '@/lib/actions/gallery-lj-exhibition-actions'
import { getImageUrl } from '@/lib/r2/url'

interface GalleryLjExhibitionRow {
  id: number
  name: string
  description: string | null
  startDate: Date | null
  endDate: Date | null
  location: string | null
  imageUrl: string | null
  visible: boolean
  createdAt: Date
  _count: {
    artworks: number
  }
}

interface GalleryLjExhibitionsClientProps {
  exhibitions: GalleryLjExhibitionRow[]
  totalItems: number
  currentPage: number
  itemsPerPage: number
  sortColumn: string
  sortDirection: 'asc' | 'desc'
}

function formatDate(date: Date | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export default function GalleryLjExhibitionsClient({
  exhibitions: initialExhibitions,
  totalItems,
  currentPage,
  itemsPerPage,
  sortColumn,
  sortDirection
}: GalleryLjExhibitionsClientProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) || 'fr'
  const { success, error: showError } = useToast()
  const [exhibitions, setExhibitions] = useState(initialExhibitions)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const result = await deleteGalleryLjExhibition(id)
      if (result.success) {
        setExhibitions((prev) => prev.filter((e) => e.id !== id))
        success('Exposition supprimée avec succès')
      } else {
        showError(result.message ?? 'Erreur lors de la suppression')
      }
    } catch {
      showError('Erreur inattendue lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  const handleRowClick = (exhibition: GalleryLjExhibitionRow) => {
    router.push(`/${locale}/galleryLj/events/${exhibition.id}/edit`)
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

  const columns: Column<GalleryLjExhibitionRow>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '60px',
      render: (exhibition) => <span>{exhibition.id}</span>
    },
    {
      key: 'image',
      header: 'Image',
      width: '60px',
      render: (exhibition) => {
        const url = exhibition.imageUrl ? getImageUrl(exhibition.imageUrl) : null
        if (!url) return <span className="text-text-muted text-sm">-</span>
        return (
          <div className="relative w-10 h-10 rounded overflow-hidden">
            <Image
              src={url}
              alt={exhibition.name}
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
      header: 'Nom',
      render: (exhibition) => (
        <span className="font-medium">{exhibition.name}</span>
      )
    },
    {
      key: 'location',
      header: 'Lieu',
      render: (exhibition) => <span>{exhibition.location ?? '-'}</span>
    },
    {
      key: 'startDate',
      header: 'Date début',
      width: '120px',
      render: (exhibition) => <span>{formatDate(exhibition.startDate)}</span>
    },
    {
      key: 'endDate',
      header: 'Date fin',
      width: '120px',
      render: (exhibition) => <span>{formatDate(exhibition.endDate)}</span>
    },
    {
      key: 'artworks',
      header: 'Œuvres',
      width: '80px',
      render: (exhibition) => <span>{exhibition._count.artworks}</span>
    },
    {
      key: 'visible',
      header: 'Visible',
      width: '80px',
      render: (exhibition) => (
        <span
          className={`badge ${exhibition.visible ? 'badge-success' : 'badge-secondary'}`}
        >
          {exhibition.visible ? 'Oui' : 'Non'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: (exhibition) => (
        <DeleteActionButton
          onDelete={() => handleDelete(exhibition.id)}
          disabled={deletingId !== null}
          itemName={`l'exposition "${exhibition.name}"`}
          confirmMessage={`Êtes-vous sûr de vouloir supprimer l'exposition "${exhibition.name}" ?`}
        />
      )
    }
  ]

  // Suppress unused variable warning — handleSort is wired via DataTable onSort if available,
  // but kept here for parity with the artworks pattern.
  void handleSort

  return (
    <PageContainer>
      <PageHeader
        title="Evènements — Galerie LJ"
        subtitle="Gérez les évènements de la galerie LJ"
        actions={
          <ActionButton
            label="Nouvel évènement"
            onClick={() => router.push(`/${locale}/galleryLj/events/create`)}
            size="small"
          />
        }
      />
      <PageContent>
        <DataTable
          data={exhibitions}
          columns={columns}
          keyExtractor={(e) => e.id}
          onRowClick={handleRowClick}
          isLoading={false}
          loadingRowId={deletingId}
          emptyState={
            <EmptyState
              message="Aucun évènement trouvé"
              action={
                <ActionButton
                  label="Nouvel évènement"
                  onClick={() => router.push(`/${locale}/galleryLj/events/create`)}
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
