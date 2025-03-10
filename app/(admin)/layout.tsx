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
  
  if (isAdmin === null) {
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
  ) : null
} 