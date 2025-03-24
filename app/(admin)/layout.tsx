'use client'

import { useEffect, useState } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar/Navbar'
import SideMenu from '@/app/components/SideMenu/SideMenu'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useIsAdmin } from '../hooks/useIsAdmin'

export default function AdminLayout({ children }: { children: React.ReactNode }) { 
  const { primaryWallet } = useDynamicContext()
  const router = useRouter()
  const { isAdmin, isLoading } = useIsAdmin()
  
  if (isLoading || isAdmin === null) {
    return <LoadingSpinner message="Vérification des droits administrateur..." />
  }
  
  return isAdmin ? (
    <>
      <Navbar />
      <div className="page-layout">
        <SideMenu />
        <div className="content-container">
          {children}
        </div>
      </div>
    </>
  ) : (
    <>
      <Navbar />
      <div className="page-layout">
        <div className="content-container">
          <p>Vous n'êtes pas autorisé à accéder à cette page ou vous n'êtes pas connecté.</p>
          <p>Veuillez vous connecter pour voir cette page.</p>
        </div>
      </div>
    </>
  )
} 