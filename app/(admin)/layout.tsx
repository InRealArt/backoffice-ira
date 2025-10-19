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
      <div className="flex min-h-[calc(100vh-90px)] mt-0 bg-background-main transition-colors duration-300">
        <SideMenu />
        <div className="flex-1 p-xxl ml-[250px] transition-all duration-300 w-full overflow-x-hidden bg-background-main md:ml-0 md:p-xl xs:p-lg">
          {children}
        </div>
      </div>
    </>
  ) : (
    <>
      <Navbar />
      <div className="flex min-h-[calc(100vh-90px)] mt-0 bg-background-main transition-colors duration-300">
        <div className="flex-1 p-xxl transition-all duration-300 w-full overflow-x-hidden bg-background-main md:p-xl xs:p-lg">
          <p>Vous n'êtes pas autorisé à accéder à cette page ou vous n'êtes pas connecté.</p>
          <p>Veuillez vous connecter pour voir cette page.</p>
        </div>
      </div>
    </>
  )
} 