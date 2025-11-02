'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import Button from '@/app/components/Button/Button'
import { useToast } from '@/app/components/Toast/ToastContext'

export default function SignInPage () {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { error: errorToast } = useToast()

  const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const { error: authError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: '/dashboard'
    }, {
      onError: ctx => {
        const errorMessage = ctx.error?.message || 'Erreur de connexion'
        errorToast(errorMessage)
      }
    })
    setIsLoading(false)
    if (!authError) {
      router.push('/dashboard')
    } else {
      const errorMessage = authError.message || 'Erreur de connexion'
      errorToast(errorMessage)
    }
  }, [email, password, router, errorToast])

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title text-2xl'>Se connecter</h2>
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
            <div className='form-control'>
              <label className='label pb-2'>
                <span className='label-text font-semibold text-base-content'>Mot de passe</span>
              </label>
              <input
                type='password'
                className='input w-full bg-base-200 border-2 border-base-300 rounded-lg px-4 py-3 text-base-content placeholder:text-base-content/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm hover:border-base-content/30'
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete='current-password'
                placeholder='••••••••'
              />
            </div>
            <div className='form-control mt-2'>
              <Button
                variant='primary'
                size='medium'
                isLoading={isLoading}
                loadingText='Connexion...'
                type='submit'
              >
                Se connecter
              </Button>
            </div>
          </form>
          <p className='text-sm mt-2'>
            Pas de compte ?{' '}
            <Link href='/sign-up' className='link link-primary'>S’inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  )
}


