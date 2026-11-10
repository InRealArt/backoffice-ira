'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import Button from '@/app/components/Button/Button'
import { getClientBaseUrl } from '@/lib/app-url'
import AuthShell, { AuthAlert, AuthField, AuthGhostButton, AuthSuccess } from '@/app/components/AuthShell/AuthShell'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setIsSuccess(false)
    setFormError(null)

    try {
      const baseURL = getClientBaseUrl()

      // Better Auth 1.5 : requestPasswordReset (forgetPassword est déprécié).
      // La réponse est volontairement identique que l'email existe ou non
      // (protection contre l'énumération de comptes).
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${baseURL}/reset-password`
      })

      if (error) {
        setFormError(error.message || 'Erreur lors de l\'envoi de l\'email')
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      setIsLoading(false)
    } catch (err: any) {
      setFormError(err.message || 'Une erreur est survenue')
      setIsLoading(false)
    }
  }, [email])

  if (isSuccess) {
    return (
      <AuthShell title='Vérifiez votre boîte mail'>
        <AuthSuccess title='Email envoyé'>
          <p>
            Si un compte existe pour <strong>{email}</strong>, un email de réinitialisation vient d'être envoyé.
            Le lien est valable 1 heure.
          </p>
          <p>Si vous ne recevez rien dans quelques minutes, vérifiez votre dossier spam.</p>
          <Button variant='primary' size='medium' onClick={() => router.push('/sign-in')}>
            Retour à la connexion
          </Button>
          <AuthGhostButton
            onClick={() => {
              setIsSuccess(false)
              setEmail('')
            }}
          >
            Réessayer avec une autre adresse
          </AuthGhostButton>
        </AuthSuccess>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title='Mot de passe oublié'
      subtitle='Entrez votre adresse email : nous vous enverrons un lien pour réinitialiser votre mot de passe.'
      footer={
        <p>
          <Link href='/sign-in'>Retour à la connexion</Link>
        </p>
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
        {formError ? <AuthAlert>{formError}</AuthAlert> : null}
        <Button
          variant='primary'
          size='medium'
          isLoading={isLoading}
          loadingText='Envoi en cours...'
          type='submit'
        >
          Envoyer le lien
        </Button>
      </form>
    </AuthShell>
  )
}
