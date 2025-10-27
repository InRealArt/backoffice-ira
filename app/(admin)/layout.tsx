'use client'

import { useEffect, useState } from 'react'
import { useDynamicContext, DynamicWidget, useIsLoggedIn } from '@dynamic-labs/sdk-react-core'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar/Navbar'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useIsAdmin } from '../hooks/useIsAdmin'

export default function AdminLayout({ children }: { children: React.ReactNode }) { 
  const { primaryWallet } = useDynamicContext()
  const router = useRouter()
  const { isAdmin, isLoading } = useIsAdmin()
  const isLoggedIn = useIsLoggedIn()
  
  if (isLoading || isAdmin === null) {
    return <LoadingSpinner message="Vérification des droits administrateur..." />
  }
  
  return isAdmin ? (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-90px)] mt-[90px] bg-background-main transition-colors duration-300">
        <div className="w-full p-xxl transition-all duration-300 overflow-x-hidden bg-background-main md:p-xl xs:p-lg">
          {children}
        </div>
      </div>
    </>
  ) : (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-90px)] mt-[90px] bg-background-main transition-colors duration-300">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-xxl md:p-xl xs:p-lg">
          <div className="max-w-md w-full text-center space-y-6">
            {!isLoggedIn ? (
              <>
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-text-main">
                    Connexion requise
                  </h2>
                  <p className="text-lg text-text-secondary">
                    Veuillez vous connecter pour accéder à l'administration.
                  </p>
                </div>
                <div className="dynamic-widget-container">
                  <DynamicWidget variant="modal" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-text-main">
                    Accès non autorisé
                  </h2>
                  <p className="text-lg text-text-secondary">
                    Votre compte n'a pas les droits administrateur nécessaires pour accéder à cette section.
                  </p>
                  <p className="text-sm text-text-muted">
                    Contactez l'équipe InRealArt si vous pensez qu'il s'agit d'une erreur.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 