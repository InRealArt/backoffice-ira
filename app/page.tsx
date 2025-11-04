'use client'

import { useState, useEffect } from 'react'
import Navbar from './components/Navbar/Navbar'
import AuthObserver from './components/Auth/AuthObserver'
import UnauthorizedMessage from './components/Auth/UnauthorizedMessage'
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner'
import { authClient } from '@/lib/auth-client'
import { checkAuthorizedUser } from '@/lib/actions/auth-actions'
import { useRouter } from 'next/navigation'

const checkIsDarkSchemePreferred = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia?.('(prefers-color-scheme:dark)')?.matches ?? false
  }
  return false
}

export default function Main() {
  const [isDarkMode, setIsDarkMode] = useState(checkIsDarkSchemePreferred)
  const { data: session, isPending } = authClient.useSession()
  const user = session?.user
  const userEmail = user?.email
  const isLoggedIn = !!session
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setIsDarkMode(checkIsDarkSchemePreferred())
    
    darkModeMediaQuery.addEventListener('change', handleChange)
    return () => darkModeMediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    let isMounted = true

    const checkAuthorization = async () => {
      // Réinitialiser la redirection si l'état change
      if (!isLoggedIn && !isPending) {
        if (isMounted) {
          setIsAuthorized(null)
          setHasRedirected(false)
        }
        return
      }

      if (isLoggedIn && userEmail && !isPending && !hasRedirected) {
        setIsLoading(true)
        try {
          // Utilisation de la Server Action au lieu de l'API Route
          const result = await checkAuthorizedUser(userEmail)
          
          if (!isMounted) return
          
          setIsAuthorized(result.authorized)
          
          // Rediriger immédiatement si autorisé (évite un useEffect séparé)
          if (result.authorized && !hasRedirected) {
            setHasRedirected(true)
            router.push('/dashboard')
          }
        } catch (error) {
          if (!isMounted) return
          console.error('Erreur lors de la vérification de l\'autorisation:', error)
          setIsAuthorized(false)
        } finally {
          if (isMounted) {
            setIsLoading(false)
          }
        }
      }
    }

    checkAuthorization()

    return () => {
      isMounted = false
    }
  }, [isLoggedIn, userEmail, isPending, hasRedirected, router])

  if (isPending || isLoading) {
    return (
      <>
        <Navbar />
        <LoadingSpinner message="Vérification de vos accès..." />
      </>
    )
  }

  if (isLoggedIn && isAuthorized === false) {
    return (
      <>
        <Navbar />
        <UnauthorizedMessage />
      </>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-background-main text-text-primary transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <AuthObserver />
      <Navbar />
      <div className="absolute top-0 flex items-center justify-between w-full px-4 py-2.5 dark:border-b dark:border-border">
        {/*
        <img 
          className="pl-4 h-[30px]" 
          src={isDarkMode ? "/logo-light.png" : "/logo-dark.png"} 
          alt="dynamic" 
        />
        <div className="flex gap-2.5 pr-4">
          <button 
            className="px-5 py-2.5 rounded-xl border border-text-primary bg-transparent text-text-primary font-bold transition-colors duration-300 dark:border-white dark:text-white"
            onClick={() => window.open('https://docs.dynamic.xyz', '_blank', 'noopener,noreferrer')}
          >
            Docs
          </button>
          <button 
            className="px-5 py-2.5 rounded-xl border-none bg-primary text-white font-bold cursor-pointer transition-colors duration-300"
            onClick={() => window.open('https://app.dynamic.xyz', '_blank', 'noopener,noreferrer')}
          >
            Get started
          </button>
        </div>
        */}
      </div>
      <div className="flex flex-col items-center justify-center gap-5">
        <h1 className="text-3xl font-semibold mb-8 text-center animate-titleLanding origin-center transition-all duration-300 text-text-primary dark:text-text-primary">
          Welcome to InRealArt backoffice
        </h1>
        {!isLoggedIn && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-text-secondary mt-4 opacity-90 italic text-center dark:text-text-secondary">
              Connectez-vous pour accéder au backoffice
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push('/sign-in')}
                className="px-6 py-2 bg-purple text-white border border-white rounded-lg hover:bg-purple/90 transition-colors font-medium"
              >
                Se connecter
              </button>
              <button
                onClick={() => router.push('/sign-up')}
                className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors font-medium"
              >
                S'inscrire
              </button>
            </div>
          </div>
        )}
      </div>
    </div> 
  )
}
