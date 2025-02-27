'use client'

import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import Navbar from '@/app/components/Navbar/Navbar'
import SideMenu from '@/app/components/SideMenu/SideMenu'
import CreateMemberForm from './CreateMemberForm'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import './page.css'

export default function CreateMemberPage() {
  const { primaryWallet } = useDynamicContext()
  const [isMobile, setIsMobile] = useState(false)
  
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
          
          <div className="create-member-header">
            <h1>Créer un membre Shopify</h1>
            <p className="subtitle">
              Ajoutez un nouvel artiste ou galleriste à votre boutique Shopify
            </p>
          </div>
          
          <div className="create-member-content">
            <CreateMemberForm />
          </div>
        </div>
      </div>
    </>
  )
} 