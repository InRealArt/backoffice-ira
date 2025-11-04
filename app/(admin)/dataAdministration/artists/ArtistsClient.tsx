'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Artist } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  Badge,
  Column
} from '../../../components/PageLayout/index'

interface ArtistsClientProps {
  artists: Artist[]
}

export default function ArtistsClient({ artists }: ArtistsClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingArtistId, setLoadingArtistId] = useState<number | null>(null)
  
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
  
  const handleArtistClick = (artist: Artist) => {
    setLoadingArtistId(artist.id)
    router.push(`/dataAdministration/artists/${artist.id}/edit`)
  }

  const handleCreateArtist = () => {
    router.push('/dataAdministration/artists/create')
  }

  // Définition des colonnes pour le DataTable
  const columns: Column<Artist>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (artist) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingArtistId === artist.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingArtistId === artist.id ? 'text-muted' : ''}>
            {artist.name} {artist.surname}
          </span>
        </div>
      )
    },
    {
      key: 'pseudo',
      header: 'Pseudo'
    },
    {
      key: 'type',
      header: 'Type',
      width: '120px',
      render: (artist) => (
        <Badge 
          variant={artist.isGallery ? 'info' : 'success'}
          text={artist.isGallery ? 'Galerie' : 'Artiste'}
        />
      )
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Artistes"
        subtitle="Liste des artistes ou galleries enregistrés dans le système"
        actions={
          <ActionButton 
            label="+ Créer un artiste"
            onClick={handleCreateArtist}
            size="medium"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={artists}
          columns={columns}
          keyExtractor={(artist) => artist.id}
          onRowClick={handleArtistClick}
          isLoading={false}
          loadingRowId={loadingArtistId}
          emptyState={
            <EmptyState 
              message="Aucun artiste trouvé"
              action={
                <ActionButton
                  label="Créer un artiste"
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

