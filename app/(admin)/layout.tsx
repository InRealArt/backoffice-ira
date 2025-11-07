'use client'

import { useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar/Navbar'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useIsAdmin } from '../hooks/useIsAdmin'

export default function AdminLayout({ children }: { children: React.ReactNode }) { 
  const router = useRouter()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const { isAdmin, isLoading } = useIsAdmin()
  const isLoggedIn = !!session
  
  useEffect(() => {
    if (!isSessionPending && !isLoggedIn) {
      router.push('/sign-in')
    }
  }, [isLoggedIn, isSessionPending, router])

  if (isSessionPending || isLoading) {
    return <LoadingSpinner message="Vérification des droits administrateur..." />
  }
  
  if (!isLoggedIn) {
    return null
  }
  
  return isAdmin ? (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-90px)] mt-[90px] bg-background-main transition-colors duration-300">
        <div className="w-full max-w-[1400px] mx-auto px-8 lg:px-16 xl:px-24 py-8 transition-all duration-300 overflow-x-hidden bg-background-main md:px-12 sm:px-6">
          {children}
        </div>
      </div>
    </>
  ) : (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-90px)] mt-[90px] bg-background-main transition-colors duration-300">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] w-full max-w-[1400px] mx-auto px-8 lg:px-16 xl:px-24 py-8 md:px-12 sm:px-6">
          <div className="max-w-md w-full text-center space-y-6">
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
          </div>
        </div>
      </div>
    </>
  )
} 