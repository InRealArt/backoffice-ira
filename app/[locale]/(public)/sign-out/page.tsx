'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import Button from '@/app/components/Button/Button'
import { useToast } from '@/app/components/Toast/ToastContext'

export default function SignOutPage () {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSignedOut, setIsSignedOut] = useState(false)
  const [hasError, setHasError] = useState(false)
  const { error: errorToast, success: successToast } = useToast()

  useEffect(() => {
    // Déconnexion automatique au chargement de la page
    const signOut = async () => {
      setIsLoading(true)
      setHasError(false)

      try {
        const result = await authClient.signOut()

        if (result.error) {
          const errorMessage = result.error.message || 'Erreur lors de la déconnexion'
          errorToast(errorMessage)
          setHasError(true)
          setIsLoading(false)
        } else {
          setIsSignedOut(true)
          setIsLoading(false)
          successToast('Vous avez été déconnecté avec succès')
          // Rediriger après un court délai pour permettre le feedback visuel
          setTimeout(() => {
            router.push('/sign-in')
          }, 1500)
        }
      } catch (err) {
        console.error('Erreur lors de la déconnexion:', err)
        const errorMessage = 'Une erreur inattendue s\'est produite'
        errorToast(errorMessage)
        setHasError(true)
        setIsLoading(false)
      }
    }

    signOut()
  }, [router, errorToast, successToast])

  const handleManualSignOut = async () => {
    setIsLoading(true)
    setHasError(false)

    try {
      const result = await authClient.signOut()

      if (result.error) {
        const errorMessage = result.error.message || 'Erreur lors de la déconnexion'
        errorToast(errorMessage)
        setHasError(true)
        setIsLoading(false)
      } else {
        setIsSignedOut(true)
        setIsLoading(false)
        successToast('Vous avez été déconnecté avec succès')
        setTimeout(() => {
          router.push('/sign-in')
        }, 1500)
      }
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err)
      const errorMessage = 'Une erreur inattendue s\'est produite'
      errorToast(errorMessage)
      setHasError(true)
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title text-2xl'>Déconnexion</h2>
          
          {isSignedOut ? (
            <div className='space-y-4'>
              <p className='text-sm text-center text-success'>
                Déconnexion réussie
              </p>
              <p className='text-sm text-center'>
                Redirection en cours...
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {isLoading ? (
                <p className='text-sm text-center'>
                  Déconnexion en cours...
                </p>
              ) : null}
              
              {hasError && (
                <div className='form-control mt-2'>
                  <Button
                    variant='primary'
                    size='medium'
                    isLoading={isLoading}
                    loadingText='Déconnexion...'
                    onClick={handleManualSignOut}
                  >
                    Réessayer
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className='divider'></div>
          
          <p className='text-sm text-center'>
            <Link href='/sign-in' className='link link-primary'>
              Retour à la page de connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

