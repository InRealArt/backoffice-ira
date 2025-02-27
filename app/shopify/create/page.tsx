'use client'

import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar/Navbar'
import SideMenu from '@/app/components/SideMenu/SideMenu'
import { Toaster, toast } from 'react-hot-toast'
import './page.css'
import ArtworkCreationForm from './ArtworkCreationForm'

export default function CreateArtworkPage() {
  const { user, primaryWallet } = useDynamicContext()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    if (!user || !primaryWallet) {
      router.push('/')
      return
    }

    // Vérifier les droits d'accès
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/shopify/isArtistAndGranted', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: primaryWallet.address
          }),
        })
        
        if (!response.ok) {
          throw new Error('Erreur lors de la vérification des droits')
        }
        
        const result = await response.json()
        
        if (result.hasAccess) {
          setHasAccess(true)
          setIsLoading(false)
        } else {
          // Afficher un toast d'erreur avant la redirection
          toast.error("Vous n'avez pas les droits pour créer une œuvre d'art")
          // Rediriger si l'utilisateur n'a pas les droits
          router.push('/')
        }
      } catch (error) {
        console.error('Erreur:', error)
        router.push('/')
      }
    }

    // Déterminer si l'appareil est mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkAccess()
    checkIfMobile()
    
    window.addEventListener('resize', checkIfMobile)
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [user, primaryWallet, router])

  if (isLoading) {
    return <div className="loading-container">Chargement...</div>
  }

  return (
    <>
      <Navbar />
      <div className="page-layout">
        <SideMenu />
        <div className="content-container">
          <Toaster 
            position={isMobile ? "bottom-center" : "top-right"} 
            toastOptions={{
              duration: isMobile ? 5000 : 3000,
            }}
          />
          
          <div className="artwork-creation-header">
            <h1>Créer une œuvre d'art</h1>
            <p className="subtitle">
              Ajoutez une nouvelle œuvre à votre collection Shopify
            </p>
          </div>
          
          <div className="artwork-creation-content">
            <ArtworkCreationForm />
          </div>
        </div>
      </div>
    </>
  )
}