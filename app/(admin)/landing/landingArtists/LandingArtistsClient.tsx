'use client'

import { useState, useEffect } from 'react'
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
  Badge,
  Column
} from '../../../components/PageLayout/index'
import styles from '../../../styles/list-components.module.scss'

interface LandingArtistWithArtist {
  id: number
  intro: string | null
  artworkImages: any
  artworkStyle: string | null
  artistsPage: boolean | null
  imageUrl: string
  artistId: number
  artist: {
    id: number
    name: string
    surname: string
    pseudo: string
  }
}

interface LandingArtistsClientProps {
  landingArtists: LandingArtistWithArtist[]
}

export default function LandingArtistsClient({ landingArtists }: LandingArtistsClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingArtistId, setLoadingArtistId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
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
  
  const handleArtistClick = (landingArtist: LandingArtistWithArtist) => {
    setLoadingArtistId(landingArtist.id)
    router.push(`/landing/landingArtists/${landingArtist.id}/edit`)
  }
  
  const handleCreateArtist = () => {
    setIsCreating(true)
    router.push('/landing/landingArtists/create')
  }
  
  // Fonction pour déterminer le variant du badge de visibilité
  const getVisibilityBadge = (isVisible: boolean | null) => {
    if (isVisible === true) {
      return <Badge variant="success" text="Visible" />
    } else {
      return <Badge variant="danger" text="Masqué" />
    }
  }
  
  // Définition des colonnes pour le DataTable
  const columns: Column<LandingArtistWithArtist>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (landingArtist) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingArtistId === landingArtist.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingArtistId === landingArtist.id ? 'text-muted' : ''}>
            {landingArtist.artist.name} {landingArtist.artist.surname}
          </span>
        </div>
      )
    },
    {
      key: 'pseudo',
      header: 'Pseudo',
      render: (landingArtist) => landingArtist.artist.pseudo
    },
    {
      key: 'visibility',
      header: 'Visibilité',
      render: (landingArtist) => (
        <div className="d-flex align-items-center">
          {getVisibilityBadge(landingArtist.artistsPage)}
        </div>
      )
    },
    {
      key: 'image',
      header: 'Image',
      className: 'hidden-mobile',
      render: (landingArtist) => (
        landingArtist.imageUrl ? (
          <div className={styles.thumbnailContainer}>
            <Image
              src={landingArtist.imageUrl}
              alt={`${landingArtist.artist.name} ${landingArtist.artist.surname}`}
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        ) : null
      )
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Artistes de la page d'accueil"
        subtitle="Liste des artistes visibles sur la page d'accueil du site"
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
        <DataTable
          data={landingArtists}
          columns={columns}
          keyExtractor={(landingArtist) => landingArtist.id}
          onRowClick={handleArtistClick}
          isLoading={false}
          loadingRowId={loadingArtistId}
          emptyState={
            <EmptyState 
              message="Aucun artiste trouvé"
              action={
                <ActionButton
                  label="Ajouter un premier artiste"
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