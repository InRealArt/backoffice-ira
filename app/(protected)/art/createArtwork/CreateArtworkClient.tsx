'use client'

import { useState, useEffect } from 'react'
import ArtworkForm from '../components/ArtworkForm'
import styles from './createArtwork.module.scss'
import { authClient } from '@/lib/auth-client'
import { getBackofficeUserByEmail, getBackofficeUserAddresses } from '@/lib/actions/prisma-actions'
import { useRouter } from 'next/navigation'
import { Address } from '../components/ArtworkForm/types'
import { ArtworkMedium, ArtworkStyle, ArtworkTechnique } from '@prisma/client'

interface CreateArtworkClientProps {
  mediums: ArtworkMedium[]
  styles: ArtworkStyle[]
  techniques: ArtworkTechnique[]
}

export default function CreateArtworkClient({ mediums, styles: artStyles, techniques }: CreateArtworkClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [artistName, setArtistName] = useState('')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)
  const { data: session, isPending: isSessionPending } = authClient.useSession()
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
  
  useEffect(() => {
    // Attendre que la session soit chargée
    if (isSessionPending) {
      return
    }

    const fetchData = async () => {
      if (session?.user?.email) {
        try {
          // Récupérer les informations utilisateur et les adresses en parallèle
          const [backofficeUser, userAddresses] = await Promise.all([
            getBackofficeUserByEmail(session.user.email),
            getBackofficeUserAddresses(session.user.email)
          ])
          
          if (backofficeUser) {
            // Utiliser firstName et lastName pour composer le nom complet
            setArtistName(
              `${backofficeUser.artist?.name || ''} ${backofficeUser.artist?.surname || ''}`.trim()
            )
          }
          
          setAddresses(userAddresses)
        } catch (error) {
          console.error('Erreur lors de la récupération des données:', error)
        } finally {
          setIsLoadingAddresses(false)
        }
      }
    }
    
    fetchData()
  }, [session?.user?.email, isSessionPending])
  
  const handleSuccess = () => {
    router.push('/art/collection')
  }
  
  return (
    <>
      <div className={styles.artworkCreationHeader}>
        <h1>Créer une œuvre dans la Collection de l'artiste <span className={styles.artistHighlight}>{artistName}</span></h1>
        <p className={styles.subtitle}>
          Ajoutez une nouvelle œuvre à votre collection
        </p>
      </div>
      
      <ArtworkForm 
        mode="create" 
        addresses={addresses}
        mediums={mediums}
        styles={artStyles}
        techniques={techniques}
        onSuccess={handleSuccess} 
      />
    </>
  )
} 