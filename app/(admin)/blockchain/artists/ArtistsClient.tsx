'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Artist } from '@prisma/client'
import styles from './ArtistsClient.module.scss'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
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
    router.push(`/blockchain/artists/${artistId}/edit`)
  }
  
  // Fonction pour obtenir le badge en fonction du type d'artiste
  const getArtistTypeBadge = (isGallery: boolean | null) => {
    if (isGallery === true) {
      return <span className={`${styles.typeBadge} ${styles.galleryBadge}`}>Galerie</span>
    } else {
      return <span className={`${styles.typeBadge} ${styles.artistBadge}`}>Artiste</span>
    }
  }
  
  return (
    <div className={styles.artistsContainer}>
      <div className={styles.artistsHeader}>
        <h1 className={styles.pageTitle}>Artistes</h1>
        <p className={styles.subtitle}>
          Liste des artistes enregistrés dans le système
        </p>
      </div>
      
      <div className={styles.artistsContent}>
        {artists.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucun artiste trouvé</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.artistsTable}>
              <thead>
                <tr>
                  {/* <th className={styles.imageColumn}>Image</th> */}
                  <th>Nom</th>
                  <th>Pseudo</th>
                  <th>Type</th>
                  <th className={styles.hiddenMobile}>Clé publique</th>
                </tr>
              </thead>
              <tbody>
                {artists.map((artist) => {
                  const isLoading = loadingArtistId === artist.id
                  return (
                    <tr 
                      key={artist.id} 
                      onClick={() => !loadingArtistId && handleArtistClick(artist.id)}
                      className={`${styles.clickableRow} ${isLoading ? styles.loadingRow : ''} ${loadingArtistId && !isLoading ? styles.disabledRow : ''}`}
                    >
                      {/* <td className={styles.imageColumn}>
                        <div className={styles.artistImage}>
                          {artist.imageUrl ? (
                            <Image 
                              src={artist.imageUrl} 
                              alt={`${artist.name} ${artist.surname}`}
                              width={40}
                              height={40}
                              className={styles.avatarImage}
                            />
                          ) : (
                            <div className={styles.placeholderImage}>
                              {artist.name.charAt(0)}{artist.surname.charAt(0)}
                            </div>
                          )}
                        </div>
                      </td> */}
                      <td>
                        <div className={styles.nameCell}>
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? styles.loadingText : ''}>
                            {artist.name} {artist.surname}
                          </span>
                        </div>
                      </td>
                      <td>{artist.pseudo}</td>
                      <td>
                        <div className={styles.typeCell}>
                          {getArtistTypeBadge(artist.isGallery)}
                        </div>
                      </td>
                      <td className={styles.hiddenMobile}>
                        <span className={styles.truncatedKey} title={artist.publicKey}>
                          {truncatePublicKey(artist.publicKey)}
                        </span>
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

// Fonction pour tronquer la clé publique
function truncatePublicKey(key: string): string {
  if (key.length <= 16) return key
  return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`
} 