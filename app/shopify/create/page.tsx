'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/app/components/Navbar/Navbar'
import SideMenu from '@/app/components/SideMenu/SideMenu'
import { Toaster } from 'react-hot-toast'
import ArtworkCreationForm from './ArtworkCreationForm'
import styles from './page.module.scss'

export default function CreateArtworkPage() {
  const [isMobile, setIsMobile] = useState(false)
  
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
  
  return (
    <>
      <Navbar />
      <div className={styles.pageLayout}>
        <SideMenu />
        <div className={styles.contentContainer}>
          <Toaster 
            position={isMobile ? "bottom-center" : "top-right"} 
            toastOptions={{ duration: isMobile ? 5000 : 3000 }}
          />
          
          <div className={styles.artworkCreationHeader}>
            <h1>Créer une œuvre</h1>
            <p className={styles.subtitle}>
              Ajoutez une nouvelle œuvre à votre collection Shopify
            </p>
          </div>
          
          <ArtworkCreationForm />
        </div>
      </div>
    </>
  )
}