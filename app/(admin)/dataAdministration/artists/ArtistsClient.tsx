'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Artist } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import BlockchainAddress from '@/app/components/blockchain/BlockchainAddress'
import Image from 'next/image'

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
  
  const handleArtistClick = (artistId: number) => {
    setLoadingArtistId(artistId)
    router.push(`/dataAdministration/artists/${artistId}/edit`)
  }
  
  // Fonction pour obtenir le badge en fonction du type d'artiste
  const getArtistTypeBadge = (isGallery: boolean | null) => {
    if (isGallery === true) {
      return <span className="info-badge" style={{ backgroundColor: '#e8eaf6', color: '#3f51b5' }}>Galerie</span>
    } else {
      return <span className="info-badge" style={{ backgroundColor: '#e0f2f1', color: '#00796b' }}>Artiste</span>
    }
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Artistes</h1>
        </div>
        <p className="page-subtitle">
          Liste des artistes ou galleries enregistrés dans le système
        </p>
      </div>
      
      <div className="page-content">
        {artists.length === 0 ? (
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
                  <th>Type</th>
                  <th className="hidden-mobile">Clé publique</th>
                </tr>
              </thead>
              <tbody>
                {artists.map((artist) => {
                  const isLoading = loadingArtistId === artist.id
                  return (
                    <tr 
                      key={artist.id} 
                      onClick={() => !loadingArtistId && handleArtistClick(artist.id)}
                      className={`clickable-row ${isLoading ? 'loading-row' : ''} ${loadingArtistId && !isLoading ? 'disabled-row' : ''}`}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? 'text-muted' : ''}>
                            {artist.name} {artist.surname}
                          </span>
                        </div>
                      </td>
                      <td>{artist.pseudo}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          {getArtistTypeBadge(artist.isGallery)}
                        </div>
                      </td>
                      <td className="hidden-mobile">
                        <BlockchainAddress 
                          address={artist.publicKey} 
                          network="sepolia" // Valeur par défaut, peut être ajustée si vous stockez le réseau préféré de l'artiste
                        />
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

