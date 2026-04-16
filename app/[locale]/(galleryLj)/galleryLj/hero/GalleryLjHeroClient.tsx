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
import { deleteGalleryLjHero } from '@/lib/actions/gallery-lj-hero-actions'
import { getImageUrl } from '@/lib/r2/url'

interface GalleryLjHeroRow {
  id: number
  image: string
  title: string
  text: string | null
  ctaUrl: string | null
}

interface GalleryLjHeroClientProps {
  heroes: GalleryLjHeroRow[]
}

function truncate(str: string | null, max: number): string {
  if (!str) return '-'
  return str.length > max ? str.slice(0, max) + '...' : str
}

export default function GalleryLjHeroClient({ heroes: initialHeroes }: GalleryLjHeroClientProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) || 'fr'
  const { success, error: showError } = useToast()
  const [heroes, setHeroes] = useState(initialHeroes)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const hasReachedHeroLimit = heroes.length >= 1

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const result = await deleteGalleryLjHero(id)
      if (result.success) {
        setHeroes((prev) => prev.filter((h) => h.id !== id))
        success('Héro supprimé avec succès')
      } else {
        showError(result.message ?? 'Erreur lors de la suppression')
      }
    } catch {
      showError('Erreur inattendue lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  const handleRowClick = (hero: GalleryLjHeroRow) => {
    router.push(`/${locale}/galleryLj/hero/${hero.id}/edit`)
  }

  const columns: Column<GalleryLjHeroRow>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '60px',
      render: (hero) => <span>{hero.id}</span>
    },
    {
      key: 'image',
      header: 'Image',
      width: '60px',
      render: (hero) => {
        const url = hero.image ? getImageUrl(hero.image) : null
        if (!url) return <span className="text-text-muted text-sm">-</span>
        return (
          <div className="relative w-10 h-10 rounded overflow-hidden">
            <Image
              src={url}
              alt={hero.title}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        )
      }
    },
    {
      key: 'title',
      header: 'Titre',
      render: (hero) => (
        <span className="font-medium">{hero.title}</span>
      )
    },
    {
      key: 'text',
      header: 'Texte',
      render: (hero) => <span>{truncate(hero.text, 60)}</span>
    },
    {
      key: 'ctaUrl',
      header: 'URL CTA',
      render: (hero) => <span>{truncate(hero.ctaUrl, 60)}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: (hero) => (
        <DeleteActionButton
          onDelete={() => handleDelete(hero.id)}
          disabled={deletingId !== null}
          itemName={`le héro "${hero.title}"`}
          confirmMessage={`Êtes-vous sûr de vouloir supprimer le héro "${hero.title}" ?`}
        />
      )
    }
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Hero — Galerie LJ"
        subtitle="Gérez les sections hero de la galerie LJ"
        actions={
          <ActionButton
            label="Nouveau héro"
            onClick={() => router.push(`/${locale}/galleryLj/hero/create`)}
            size="small"
            disabled={hasReachedHeroLimit}
          />
        }
      />
      <PageContent>
        <DataTable
          data={heroes}
          columns={columns}
          keyExtractor={(h) => h.id}
          onRowClick={handleRowClick}
          isLoading={false}
          loadingRowId={deletingId}
          emptyState={
            <EmptyState
              message="Aucun héro trouvé"
              action={
                <ActionButton
                  label="Nouveau héro"
                  onClick={() => router.push(`/${locale}/galleryLj/hero/create`)}
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
