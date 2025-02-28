'use client'

import { useEffect, useState } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { primaryWallet } = useDynamicContext()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!primaryWallet) {
        router.push('/')
        return
      }
      
      try {
        const response = await fetch('/api/shopify/isAdmin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: primaryWallet.address }),
        })
        
        const result = await response.json()
        
        if (result.isAdmin) {
          setIsAdmin(true)
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Erreur:', error)
        router.push('/dashboard')
      }
    }
    
    checkAdminStatus()
  }, [primaryWallet, router])
  
  if (isAdmin === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner message="Vérification des droits administrateur..." />
      </div>
    )
  }
  
  return isAdmin ? children : null
} 