'use client'

import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import ArtworkCreationForm from './ArtworkCreationForm'
import styles from './createArtwork.module.scss'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { getBackofficeUserByEmail } from '@/lib/actions/prisma-actions'

export default function CreateArtworkPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [artistName, setArtistName] = useState('')
  const { user } = useDynamicContext()
  
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
    const fetchArtistName = async () => {
      if (user?.email) {
        try {
          const backofficeUser = await getBackofficeUserByEmail(user.email)
          if (backofficeUser) {
            // Utiliser firstName et lastName pour composer le nom complet
            setArtistName(
              `${backofficeUser.artist?.name || ''} ${backofficeUser.artist?.surname || ''}`.trim()
            )
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du nom d\'artiste:', error)
        }
      }
    }
    
    fetchArtistName()
  }, [user])
  
  return (
    <>
      <Toaster 
        position={isMobile ? "bottom-center" : "top-right"} 
        toastOptions={{ duration: isMobile ? 5000 : 3000 }}
      />
      
      <div className={styles.artworkCreationHeader}>
        <h1>Créer une œuvre dans la Collection de l'artiste <span className={styles.artistHighlight}>{artistName}</span></h1>
        <p className={styles.subtitle}>
          Ajoutez une nouvelle œuvre à votre collection Shopify
        </p>
      </div>
      
      <ArtworkCreationForm />
    </>
  )
} 