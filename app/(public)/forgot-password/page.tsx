'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { authClient } from '@/lib/auth-client'
import Button from '@/app/components/Button/Button'
import { useToast } from '@/app/components/Toast/ToastContext'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { success: successToast, error: errorToast } = useToast()

  const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setIsSuccess(false)

    try {
      const baseURL = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const redirectTo = `${baseURL}/reset-password`

      // Utiliser l'endpoint request-password-reset de Better Auth
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          redirectTo
        })
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        const errorMessage = data.error?.message || data.message || 'Erreur lors de l\'envoi de l\'email'
        errorToast(errorMessage)
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      successToast('Un email de réinitialisation a été envoyé à votre adresse')
      setIsLoading(false)
    } catch (err: any) {
      errorToast(err.message || 'Une erreur est survenue')
      setIsLoading(false)
    }
  }, [email, successToast, errorToast])

  if (isSuccess) {
    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <div className='card w-full max-w-md bg-base-100 shadow-xl'>
          <div className='card-body'>
            <div className='flex items-center justify-center gap-3 mb-6 pb-6 border-b border-base-300'>
              <div className='bg-black rounded-md p-1 flex items-center justify-center w-[70px] h-[70px]'>
                <Image
                  src='/img/Logo_InRealArt.svg'
                  alt='InRealArt Logo'
                  width={60}
                  height={60}
                  className='logo-image'
                />
              </div>
              <span className='text-xl font-semibold text-gray-900 dark:text-white'>InRealArt backoffice</span>
            </div>
            
            <div className='text-center'>
              <div className='mb-4'>
                <svg
                  className='mx-auto h-16 w-16 text-success'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              
              <h2 className='card-title text-2xl justify-center mb-4'>
                Email envoyé !
              </h2>
              
              <p className='text-base-content/70 mb-6'>
                Nous avons envoyé un email de réinitialisation à <strong>{email}</strong>.
                Veuillez vérifier votre boîte de réception et suivre les instructions.
              </p>
              
              <p className='text-sm text-base-content/60 mb-6'>
                Si vous ne recevez pas l'email dans quelques minutes, vérifiez votre dossier spam.
              </p>
              
              <div className='flex flex-col gap-3'>
                <Button
                  variant='primary'
                  size='medium'
                  onClick={() => router.push('/sign-in')}
                >
                  Retour à la connexion
                </Button>
                <button
                  type='button'
                  onClick={() => {
                    setIsSuccess(false)
                    setEmail('')
                  }}
                  className='btn btn-ghost btn-sm'
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <div className='flex items-center justify-center gap-3 mb-6 pb-6 border-b border-base-300'>
            <div className='bg-black rounded-md p-1 flex items-center justify-center w-[70px] h-[70px]'>
              <Image
                src='/img/Logo_InRealArt.svg'
                alt='InRealArt Logo'
                width={60}
                height={60}
                className='logo-image'
              />
            </div>
            <span className='text-xl font-semibold text-gray-900 dark:text-white'>InRealArt backoffice</span>
          </div>
          
          <h2 className='card-title text-2xl'>Mot de passe oublié</h2>
          <p className='text-base-content/70 mb-6'>
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
          
          <form onSubmit={onSubmit} className='space-y-5'>
            <div className='form-control'>
              <label className='label pb-2'>
                <span className='label-text font-semibold text-base-content'>Email</span>
              </label>
              <input
                type='email'
                className='input w-full bg-base-200 border-2 border-base-300 rounded-lg px-4 py-3 text-base-content placeholder:text-base-content/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm hover:border-base-content/30'
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete='email'
                placeholder='votre.email@exemple.com'
              />
            </div>
            
            <div className='form-control mt-2'>
              <Button
                variant='primary'
                size='medium'
                isLoading={isLoading}
                loadingText='Envoi en cours...'
                type='submit'
              >
                Envoyer l'email de réinitialisation
              </Button>
            </div>
          </form>
          
          <p className='text-sm mt-4 text-center'>
            <Link href='/sign-in' className='link link-primary'>
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

