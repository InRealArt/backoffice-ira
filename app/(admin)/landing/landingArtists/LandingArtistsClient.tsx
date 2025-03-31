'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Image from 'next/image'
import { Plus } from 'lucide-react'

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
  
  const handleArtistClick = (landingArtistId: number) => {
    setLoadingArtistId(landingArtistId)
    router.push(`/landing/landingArtists/${landingArtistId}/edit`)
  }
  
  const handleCreateArtist = () => {
    setIsCreating(true)
    router.push('/landing/landingArtists/create')
  }
  
  // Fonction pour déterminer si un artiste est visible sur la page d'accueil
  const getArtistVisibilityBadge = (isVisible: boolean | null) => {
    if (isVisible === true) {
      return <span className="info-badge" style={{ backgroundColor: '#e0f2f1', color: '#00796b' }}>Visible</span>
    } else {
      return <span className="info-badge" style={{ backgroundColor: '#ffebee', color: '#c62828' }}>Masqué</span>
    }
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Artistes de la page d'accueil</h1>
          <button 
            onClick={handleCreateArtist}
            disabled={isCreating}
            className="btn btn-primary btn-medium"
          >
            {isCreating ? (
              <LoadingSpinner size="small" message="" inline />
            ) : (
              <div className="d-flex align-items-center gap-sm">
                <Plus size={16} />
                <span>Ajouter un artiste</span>
              </div>
            )}
          </button>
        </div>
        <p className="page-subtitle">
          Liste des artistes visibles sur la page d'accueil du site
        </p>
      </div>
      
      <div className="page-content">
        {landingArtists.length === 0 ? (
          <div className="empty-state">
            <p>Aucun artiste trouvé</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Pseudo</th>
                  <th>Visibilité</th>
                  <th className="hidden-mobile">Image</th>
                </tr>
              </thead>
              <tbody>
                {landingArtists.map((landingArtist) => {
                  const isLoading = loadingArtistId === landingArtist.id
                  return (
                    <tr 
                      key={landingArtist.id} 
                      onClick={() => !loadingArtistId && handleArtistClick(landingArtist.id)}
                      className={`clickable-row ${isLoading ? 'loading-row' : ''} ${loadingArtistId && !isLoading ? 'disabled-row' : ''}`}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? 'text-muted' : ''}>
                            {landingArtist.artist.name} {landingArtist.artist.surname}
                          </span>
                        </div>
                      </td>
                      <td>{landingArtist.artist.pseudo}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          {getArtistVisibilityBadge(landingArtist.artistsPage)}
                        </div>
                      </td>
                      <td className="hidden-mobile">
                        {landingArtist.imageUrl && (
                          <div className="thumbnail-container" style={{ width: '50px', height: '50px', position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
                            <Image
                              src={landingArtist.imageUrl}
                              alt={`${landingArtist.artist.name} ${landingArtist.artist.surname}`}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 