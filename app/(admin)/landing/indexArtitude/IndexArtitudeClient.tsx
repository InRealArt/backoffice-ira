'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  Column, FilterPanel
} from '../../../components/PageLayout/index'
import styles from '../../../styles/list-components.module.scss'
import { IndexArtitudeFilter } from './IndexArtitudeFilter'
import type { ArtistName } from '@/lib/types/artist'
import { getArtistFullName } from '@/lib/utils'
import { getImageUrl } from '@/lib/r2/url'

interface ArtitudeArtistImages {
  coverImage: string | null
  exteriorImages: string[]
  interiorImages: string[]
  artistImages: string[]
  otherImages: string[]
}

interface ArtitudeArtistWithArtist {
  id: number
  city: string
  postalCode: string
  websiteUrl: string | null
  artistId: number
  artist: { id: number } & ArtistName
  images: ArtitudeArtistImages | null
}

interface IndexArtitudeClientProps {
  artitudeArtists: ArtitudeArtistWithArtist[]
}

export default function IndexArtitudeClient({ artitudeArtists }: IndexArtitudeClientProps) {
  const router = useRouter()
  const [loadingArtistId, setLoadingArtistId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleArtistClick = (artitudeArtist: ArtitudeArtistWithArtist) => {
    setLoadingArtistId(artitudeArtist.id)
    router.push(`/landing/indexArtitude/${artitudeArtist.id}/edit`)
  }

  const handleCreateArtist = () => {
    setIsCreating(true)
    router.push('/landing/indexArtitude/create')
  }

  const columns: Column<ArtitudeArtistWithArtist>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (artitudeArtist) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingArtistId === artitudeArtist.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingArtistId === artitudeArtist.id ? 'text-muted' : ''}>
            {getArtistFullName(artitudeArtist.artist)}
          </span>
        </div>
      )
    },
    {
      key: 'city',
      header: 'Ville',
      render: (artitudeArtist) => (
        <span>{artitudeArtist.city} ({artitudeArtist.postalCode})</span>
      )
    },
    {
      key: 'websiteUrl',
      header: 'Site web',
      className: 'hidden-mobile',
      render: (artitudeArtist) => artitudeArtist.websiteUrl || '-'
    },
    {
      key: 'image',
      header: 'Image',
      className: 'hidden-mobile',
      render: (artitudeArtist) => {
        const imageUrl = getImageUrl(
          artitudeArtist.images?.coverImage || artitudeArtist.images?.artistImages?.[0]
        )
        return imageUrl ? (
          <div className={styles.thumbnailContainer}>
            <Image
              src={imageUrl}
              alt={getArtistFullName(artitudeArtist.artist)}
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        ) : null
      }
    }
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Index Artitude"
        subtitle="Liste des fiches établissement Artitude des artistes"
        actions={
          <ActionButton
            label="Ajouter un artiste"
            onClick={handleCreateArtist}
            size="small"
            disabled={isCreating}
            icon={isCreating ? undefined : <Plus size={16} />}
            isLoading={isCreating}
          />
        }
      />

      <PageContent>
        <FilterPanel title="Filtrer les artistes" description="Recherchez par nom, prénom ou pseudo">
          <IndexArtitudeFilter />
        </FilterPanel>
        <DataTable
          data={artitudeArtists}
          columns={columns}
          keyExtractor={(artitudeArtist) => artitudeArtist.id}
          onRowClick={handleArtistClick}
          isLoading={false}
          loadingRowId={loadingArtistId}
          emptyState={
            <EmptyState
              message="Aucune fiche Artitude trouvée"
              action={
                <ActionButton
                  label="Ajouter une première fiche"
                  onClick={handleCreateArtist}
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
