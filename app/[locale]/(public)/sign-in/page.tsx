'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import Button from '@/app/components/Button/Button'
import AuthShell, { AuthAlert, AuthField } from '@/app/components/AuthShell/AuthShell'

export default function SignInPage () {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    setIsLoading(true)
    try {
      const { error: authError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: '/dashboard'
      })
      if (authError) {
        setFormError(
          authError.code === 'INVALID_EMAIL_OR_PASSWORD'
            ? 'Email ou mot de passe incorrect.'
            : authError.message || 'Erreur de connexion'
        )
        setIsLoading(false)
        return
      }
      router.push('/dashboard')
    } catch (err) {
      console.error('Erreur lors de la connexion:', err)
      setFormError('Une erreur inattendue s\'est produite')
      setIsLoading(false)
    }
  }, [email, password, router])

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
        {formError ? <AuthAlert>{formError}</AuthAlert> : null}
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
