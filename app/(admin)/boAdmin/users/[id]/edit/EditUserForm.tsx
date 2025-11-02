'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/Toast/ToastContext'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateBackofficeUser, getAllArtists } from '@/lib/actions/prisma-actions'
import { WhiteListedUser, Artist } from '@prisma/client'
import styles from './EditUserForm.module.scss'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'

// Schéma de validation
const formSchema = z.object({
  id: z.string(),
  email: z.string().email('Format d\'email invalide'),
  role: z.string().nullable().optional(),
  artistId: z.number().nullable().optional()
}).refine((data) => {
  // Si le rôle est 'artist', artistId est requis
  if (data.role === 'artist') {
    return data.artistId !== null && data.artistId !== undefined
  }
  return true
}, {
  message: 'Veuillez sélectionner un artiste',
  path: ['artistId'] // Spécifie le champ concerné par l'erreur
})

type FormValues = z.infer<typeof formSchema>

interface EditUserFormProps {
  user: WhiteListedUser
}

// Type spécifique pour les artistes retournés par getAllArtists
type ArtistSelectData = {
  id: number
  name: string
  surname: string
  pseudo: string
  description: string
  publicKey: string
  imageUrl: string
  isGallery: boolean
  backgroundImage: string | null
}

export default function EditUserForm({ user }: EditUserFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [artists, setArtists] = useState<ArtistSelectData[]>([])
  const [isLoadingArtists, setIsLoadingArtists] = useState(true)
  const { success, error } = useToast()
  // Déterminer si l'utilisateur est un administrateur
  const isAdmin = user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'administrateur'
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: user.id.toString(),
      email: user.email || '',
      role: user.role || null,
      artistId: user.artistId || null
    }
  })

  const selectedRole = watch('role')

  // Réinitialiser artistId quand le rôle change
  useEffect(() => {
    if (selectedRole !== 'artist') {
      setValue('artistId', null)
    }
  }, [selectedRole, setValue])

  // Charger la liste des artistes
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const artistsList = await getAllArtists()
        setArtists(artistsList)
      } catch (error: any) {
        console.error('Erreur lors du chargement des artistes:', error)
        error('Erreur lors du chargement des artistes')
      } finally {
        setIsLoadingArtists(false)
      }
    }

    fetchArtists()
  }, [])


  // Fonction de soumission du formulaire
  const onSubmit = async (data: FormValues) => {
    console.log('Début de la soumission du formulaire', data)
    setIsSubmitting(true)

    try {
      // Vérifier que toutes les données sont présentes
      if (!data || !data.id) {
        throw new Error('Données de formulaire incomplètes')
      }

      // S'assurer que tous les champs requis sont présents
      const payload = {
        id: data.id,
        email: data.email || '',
        role: data.role || null,
        artistId: data.artistId || null
      }

      console.log('Payload à envoyer:', payload)

      // Mettre à jour l'utilisateur avec le payload complet
      const userResult = await updateBackofficeUser(payload)

      if (!userResult.success) {
        throw new Error(userResult.message)
      }

      // Rediriger après 1 seconde
      setTimeout(() => {
        router.push('/boAdmin/users')
        router.refresh()
      }, 1000)
      
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error)
      error(error.message || 'Une erreur est survenue lors de la mise à jour')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>Modifier l'utilisateur</h1>
          <p className={styles.formSubtitle}>
            Modifier les informations de {user.email}
          </p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.formLabel}>
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={`${styles.formInput} ${errors.email ? styles.formInputError : ''}`}
          />
          {errors.email && (
            <p className={styles.formError}>{errors.email.message}</p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="role" className={styles.formLabel}>
            Rôle
          </label>
          <select
            id="role"
            {...register('role')}
            className={styles.formSelect}
          >
            <option value="">Sélectionnez un rôle</option>
            <option value="admin">Administrateur</option>
            <option value="artist">Artiste</option>
            <option value="galleryManager">Gestionnaire de galerie</option>
          </select>
        </div>

        {/* Liste déroulante des artistes si le rôle est "artist" */}
        {selectedRole === 'artist' && (
          <div className={styles.formGroup}>
            <label htmlFor="artistId" className={styles.formLabel}>
              Artiste associé
            </label>
            {isLoadingArtists ? (
              <div className={styles.loadingContainer}>
                <LoadingSpinner message="Chargement des artistes..." />
              </div>
            ) : (
              <>
                <select
                  id="artistId"
                  {...register('artistId', {
                    required: selectedRole === 'artist' ? 'Veuillez sélectionner un artiste' : false,
                    valueAsNumber: true
                  })}
                  className={`${styles.formSelect} ${errors.artistId ? styles.formInputError : ''}`}
                >
                  <option value="">Sélectionnez un artiste</option>
                  {artists.map((artist) => (
                    <option key={artist.id} value={artist.id}>
                      {artist.name} {artist.surname} ({artist.pseudo})
                    </option>
                  ))}
                </select>
                {errors.artistId && (
                  <p className={styles.formError}>{errors.artistId.message}</p>
                )}
              </>
            )}
          </div>
        )}

        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={handleCancel}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </form>
    </div>
  )
} 