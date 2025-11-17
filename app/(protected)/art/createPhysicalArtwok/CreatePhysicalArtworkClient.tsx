'use client'

import { useState, useEffect } from 'react'
import ArtworkForm from '../components/ArtworkForm'
import styles from './createPhysicalArtwork.module.scss'
import { authClient } from '@/lib/auth-client'
import { getBackofficeUserByEmail, getBackofficeUserAddresses } from '@/lib/actions/prisma-actions'
import { useRouter } from 'next/navigation'
import { Address } from '../components/ArtworkForm/types'
import { ArtworkMedium, ArtworkStyle, ArtworkTechnique, ArtworkTheme } from '@prisma/client'

interface CreatePhysicalArtworkClientProps {
  mediums: ArtworkMedium[]
  styles: ArtworkStyle[]
  techniques: ArtworkTechnique[]
  themes: ArtworkTheme[]
}

export default function CreatePhysicalArtworkClient({ mediums, styles: artStyles, techniques, themes }: CreatePhysicalArtworkClientProps) {
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
    router.push('/art/myPhysicalArtwork')
  }
  
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Créer une œuvre physique
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Ajoutez une nouvelle œuvre physique à la collection de{' '}
            <span className="font-semibold text-primary dark:text-primary">
              {artistName || 'votre artiste'}
            </span>
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 md:p-10">
        <ArtworkForm 
          mode="create" 
          addresses={addresses}
          mediums={mediums}
          styles={artStyles}
          techniques={techniques}
          themes={themes}
          onSuccess={handleSuccess}
          isPhysicalOnly={true}
        />
      </div>
    </div>
  )
}

