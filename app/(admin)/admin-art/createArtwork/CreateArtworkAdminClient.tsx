'use client'

import { useState, useEffect } from 'react'
import ArtworkForm from '@/app/(protected)/art/components/ArtworkForm'
import styles from './createArtworkAdmin.module.scss'
import { useRouter } from 'next/navigation'
import { Address } from '@/app/(protected)/art/components/ArtworkForm/types'
import { ArtworkMedium, ArtworkStyle, ArtworkTechnique } from '@prisma/client'
import { getAddresses } from '@/lib/actions/address-actions'

interface Artist {
  id: number
  name: string
  surname: string
  pseudo: string | null
  description: string | null
  publicKey: string | null
  imageUrl: string | null
  isGallery: boolean
  backgroundImage: string | null
  artworkStyle: any
  backofficeUserId: number | null
}

interface CreateArtworkAdminClientProps {
  mediums: ArtworkMedium[]
  styles: ArtworkStyle[]
  techniques: ArtworkTechnique[]
  artists: Artist[]
}

export default function CreateArtworkAdminClient({ 
  mediums, 
  styles: artStyles, 
  techniques, 
  artists 
}: CreateArtworkAdminClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  const [artistSearchTerm, setArtistSearchTerm] = useState('')
  const router = useRouter()
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])
  
  // Filtrer les artistes en fonction du terme de recherche
  const filteredArtists = artists.filter(artist => {
    const fullName = `${artist.name} ${artist.surname}`.toLowerCase()
    const pseudo = artist.pseudo?.toLowerCase() || ''
    const searchTerm = artistSearchTerm.toLowerCase()
    
    return fullName.includes(searchTerm) || pseudo.includes(searchTerm)
  })
  
  const handleArtistChange = async (artistId: number) => {
    const artist = artists.find(a => a.id === artistId)
    setSelectedArtist(artist || null)
    
    if (artist && artist.backofficeUserId) {
      setIsLoadingAddresses(true)
      try {
        // Récupérer les adresses de l'artiste sélectionné
        const addressesResult = await getAddresses(artist.backofficeUserId)
        if (addressesResult.success && addressesResult.data) {
          setAddresses(addressesResult.data)
        } else {
          console.error('Erreur lors de la récupération des adresses:', addressesResult.error)
          setAddresses([])
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des adresses de l\'artiste:', error)
        setAddresses([])
      } finally {
        setIsLoadingAddresses(false)
      }
    } else {
      setAddresses([])
    }
  }
  
  const handleSuccess = () => {
    router.push('/art/collection')
  }

  // Stocker l'artistId sélectionné dans le localStorage pour que le hook useArtworkForm puisse l'utiliser
  useEffect(() => {
    if (selectedArtist) {
      localStorage.setItem('adminSelectedArtistId', selectedArtist.id.toString())
    } else {
      localStorage.removeItem('adminSelectedArtistId')
    }
  }, [selectedArtist])
  
  return (
    <>
      <div className={styles.artworkCreationHeader}>
        <h1>Créer une œuvre en tant qu'Administrateur</h1>
        <p className={styles.subtitle}>
          Sélectionnez un artiste et ajoutez une nouvelle œuvre à sa collection
        </p>
      </div>
      
      {/* Section de sélection d'artiste */}
      <div className={styles.artistSelectionSection}>
        <h2>Sélection de l'Artiste</h2>
        <div className={styles.artistSearchContainer}>
          <input
            type="text"
            placeholder="Rechercher un artiste..."
            value={artistSearchTerm}
            onChange={(e) => setArtistSearchTerm(e.target.value)}
            className={styles.artistSearchInput}
          />
          
          <select
            value={selectedArtist?.id || ''}
            onChange={(e) => {
              const artistId = parseInt(e.target.value)
              if (artistId) {
                handleArtistChange(artistId)
              }
            }}
            className={styles.artistSelect}
            required
          >
            <option value="">-- Choisir un artiste --</option>
            {filteredArtists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name} {artist.surname} {artist.pseudo && `(${artist.pseudo})`}
              </option>
            ))}
          </select>
        </div>

        {selectedArtist && (
          <div className={styles.selectedArtistInfo}>
            <h3>Artiste sélectionné :</h3>
            <div className={styles.artistCard}>
              {selectedArtist.imageUrl && (
                <img 
                  src={selectedArtist.imageUrl} 
                  alt={`${selectedArtist.name} ${selectedArtist.surname}`}
                  className={styles.artistAvatar}
                />
              )}
              <div className={styles.artistDetails}>
                <h4>{selectedArtist.name} {selectedArtist.surname}</h4>
                {selectedArtist.pseudo && <p className={styles.artistPseudo}>({selectedArtist.pseudo})</p>}
                {selectedArtist.description && (
                  <p className={styles.artistDescription}>{selectedArtist.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {isLoadingAddresses && (
          <div className={styles.loadingAddresses}>
            <p>Chargement des adresses de l'artiste...</p>
          </div>
        )}

        {selectedArtist && !selectedArtist.backofficeUserId && (
          <div className={styles.noBackofficeUser}>
            <p style={{ color: '#ff6b6b', fontStyle: 'italic' }}>
              ⚠️ Cet artiste n'est pas encore associé à un utilisateur backoffice. 
              Il ne peut pas avoir d'adresses d'expédition.
            </p>
          </div>
        )}

        {selectedArtist && selectedArtist.backofficeUserId && addresses.length === 0 && !isLoadingAddresses && (
          <div className={styles.noAddresses}>
            <p style={{ color: '#ff9500', fontStyle: 'italic' }}>
              ⚠️ Cet artiste n'a pas encore créé d'adresses d'expédition.
            </p>
          </div>
        )}
      </div>

      {/* Formulaire d'œuvre d'art - exactement le même que le groupe protected */}
      {selectedArtist && selectedArtist.backofficeUserId && addresses.length > 0 && (
        <ArtworkForm 
          mode="create" 
          addresses={addresses}
          mediums={mediums}
          styles={artStyles}
          techniques={techniques}
          onSuccess={handleSuccess}
        />
      )}

      {!selectedArtist && (
        <div className={styles.noArtistSelected}>
          <p>Veuillez sélectionner un artiste pour continuer.</p>
        </div>
      )}
    </>
  )
} 