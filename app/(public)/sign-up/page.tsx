'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { authClient } from '@/lib/auth-client'
import Button from '@/app/components/Button/Button'
import { useToast } from '@/app/components/Toast/ToastContext'
import { checkWhiteListedUser, updateUserAfterSignup, deleteUserAfterFailedSignup } from '@/lib/actions/auth-actions'

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
      // 1. Créer le compte avec better-auth
      const { error: authError, data } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: '/dashboard'
      })

      if (authError) {
        const errorMessage = authError.message || 'Vous n\'êtes pas autorisé à utiliser le backoffice'
        errorToast(errorMessage)
        setIsLoading(false)
        return
      }

      // 2. Attendre un peu pour s'assurer que l'utilisateur est bien créé dans la base
      await new Promise(resolve => setTimeout(resolve, 300))

      // 3. Vérifier si l'utilisateur est dans la whitelist
      const whiteListedUser = await checkWhiteListedUser(email)

      if (!whiteListedUser) {
        // Utilisateur non whitelisté : afficher toast d'erreur
        // Supprimer le compte créé car non autorisé
        await deleteUserAfterFailedSignup(email)
        const errorMessage = 'Votre email n\'est pas autorisé à créer un compte sur cette plateforme. Veuillez contacter l\'administrateur pour être ajouté à la liste blanche.'
        errorToast(errorMessage)
        setIsLoading(false)
        return
      }

      // 4. Mettre à jour le rôle et l'artistId depuis la whitelist
      const updateResult = await updateUserAfterSignup(
        email,
        whiteListedUser.role || null,
        whiteListedUser.artistId || null
      )

      if (!updateResult.success) {
        const errorMessage = updateResult.message || 'Erreur lors de la mise à jour du profil'
        errorToast(errorMessage)
        setIsLoading(false)
        return
      }

      // 5. Connecter l'utilisateur
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: '/dashboard'
      })

      if (signInError) {
        const errorMessage = 'Erreur lors de la connexion'
        errorToast(errorMessage)
        setIsLoading(false)
        return
      }

      // 6. Rediriger vers le dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Erreur lors du signup:', err)
      const errorMessage = 'Une erreur inattendue s\'est produite'
      errorToast(errorMessage)
      setIsLoading(false)
    }
  }, [name, email, password, router, errorToast])

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
          <h2 className='card-title text-2xl'>Créer un compte</h2>
          <form onSubmit={onSubmit} className='space-y-5'>
            <div className='form-control'>
              <label className='label pb-2'>
                <span className='label-text font-semibold text-base-content'>Nom</span>
              </label>
              <input
                type='text'
                className='input w-full bg-base-200 border-2 border-base-300 rounded-lg px-4 py-3 text-base-content placeholder:text-base-content/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm hover:border-base-content/30'
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder='Votre nom. Ex : John Doe'
              />
            </div>
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
                autoComplete='new-password'
                placeholder='••••••••'
              />
            </div>
            {error ? (
              <div className='alert alert-error text-sm'>{error}</div>
            ) : null}
            <div className='form-control mt-2'>
              <Button
                variant='primary'
                size='medium'
                isLoading={isLoading}
                loadingText='Création...'
                type='submit'
              >
                {"S'inscrire"}
              </Button>
            </div>
          </form>
          <p className='text-sm mt-2'>
            Déjà un compte ?{' '}
            <Link href='/sign-in' className='link link-primary'>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}



