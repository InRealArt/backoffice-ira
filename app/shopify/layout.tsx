'use client'

import { useEffect, useState } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useRouter, usePathname } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { getRequiredAccessLevel } from '@/app/config/protectedRoutes'

export default function ShopifyLayout({ children }: { children: React.ReactNode }) {
  const { primaryWallet } = useDynamicContext()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  
  useEffect(() => {
    const requiredAccess = getRequiredAccessLevel(pathname || '')
    
    // Si la page actuelle ne nécessite pas d'être artiste, ne pas faire de vérification
    if (requiredAccess !== 'artist') {
      setIsAuthorized(true)
      return
    }
    
    const checkArtistAccess = async () => {
      if (!primaryWallet) {
        router.push('/')
        return
      }
      
      try {
        const response = await fetch('/api/shopify/isArtistAndGranted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: primaryWallet.address }),
        })
        
        const result = await response.json()
        
        if (result.hasAccess) {
          setIsAuthorized(true)
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Erreur:', error)
        router.push('/dashboard')
      }
    }
    
    checkArtistAccess()
  }, [primaryWallet, router, pathname])
  
  if (isAuthorized === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner message="Vérification des droits d'accès..." />
      </div>
    )
  }
  
  return isAuthorized ? children : null
} 