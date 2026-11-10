'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import Button from '@/app/components/Button/Button'
import { useToast } from '@/app/components/Toast/ToastContext'
import AuthShell, { AuthField } from '@/app/components/AuthShell/AuthShell'

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
    <AuthShell
      title='Se connecter'
      subtitle='Accédez à votre espace de gestion InRealArt.'
      footer={
        <>
          <p>
            Pas de compte ?{' '}
            <Link href='/sign-up'>S'inscrire</Link>
          </p>
          <p>
            <Link href='/forgot-password'>Mot de passe oublié ?</Link>
          </p>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <AuthField
          id='email'
          label='Email'
          type='email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete='email'
          placeholder='votre.email@exemple.com'
        />
        <AuthField
          id='password'
          label='Mot de passe'
          type='password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete='current-password'
          placeholder='••••••••'
        />
        <Button
          variant='primary'
          size='medium'
          isLoading={isLoading}
          loadingText='Connexion...'
          type='submit'
        >
          Se connecter
        </Button>
      </form>
    </AuthShell>
  )
}
