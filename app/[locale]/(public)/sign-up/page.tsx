'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import Button from '@/app/components/Button/Button'
import { useToast } from '@/app/components/Toast/ToastContext'
import AuthShell, { AuthField } from '@/app/components/AuthShell/AuthShell'

export default function SignUpPage () {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { error: errorToast } = useToast()

  const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // La whitelist, le rôle et l'artistId sont appliqués côté serveur (databaseHooks dans lib/auth.ts).
      // En cas d'email non autorisé, l'inscription est refusée et son message affiché.
      // L'utilisateur est connecté automatiquement après l'inscription (session déjà porteuse du rôle).
      const { error: authError } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: '/dashboard'
      })

      if (authError) {
        errorToast(authError.message || 'Vous n\'êtes pas autorisé à utiliser le backoffice')
        setIsLoading(false)
        return
      }

      // Rediriger vers le dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Erreur lors du signup:', err)
      const errorMessage = 'Une erreur inattendue s\'est produite'
      errorToast(errorMessage)
      setIsLoading(false)
    }
  }, [name, email, password, router, errorToast])

  return (
    <AuthShell
      title='Créer un compte'
      subtitle="L'accès est réservé aux artistes et gestionnaires invités par InRealArt."
      footer={
        <p>
          Déjà un compte ?{' '}
          <Link href='/sign-in'>Se connecter</Link>
        </p>
      }
    >
      <form onSubmit={onSubmit}>
        <AuthField
          id='name'
          label='Nom'
          type='text'
          value={name}
          onChange={e => setName(e.target.value)}
          autoComplete='name'
          placeholder='Votre nom. Ex : John Doe'
        />
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
          autoComplete='new-password'
          placeholder='••••••••'
        />
        {error ? (
          <div role='alert' className='alert alert-error text-sm'>{error}</div>
        ) : null}
        <Button
          variant='primary'
          size='medium'
          isLoading={isLoading}
          loadingText='Création...'
          type='submit'
        >
          {"S'inscrire"}
        </Button>
      </form>
    </AuthShell>
  )
}
