'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Artist } from '@prisma/client'
import { updateArtist } from '@/lib/actions/artist-actions'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import styles from './ArtistEditForm.module.scss'

// Schéma de validation
const formSchema = z.object({
  name: z.string().min(1, 'Le prénom est requis'),
  surname: z.string().min(1, 'Le nom est requis'),
  pseudo: z.string().min(1, 'Le pseudo est requis'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  publicKey: z.string().min(1, 'La clé publique est requise'),
  imageUrl: z.string().url('URL d\'image invalide'),
  isGallery: z.boolean().default(false),
  backgroundImage: z.string().url('URL d\'image d\'arrière-plan invalide').nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ArtistEditFormProps {
  artist: Artist
}

export default function ArtistEditForm({ artist }: ArtistEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: artist.name,
      surname: artist.surname,
      pseudo: artist.pseudo,
      description: artist.description,
      publicKey: artist.publicKey,
      imageUrl: artist.imageUrl,
      isGallery: artist.isGallery || false,
      backgroundImage: artist.backgroundImage || null,
    }
  })

  const isGallery = watch('isGallery')
  const imageUrl = watch('imageUrl')
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Transformer undefined en null pour backgroundImage
      const formattedData = {
        ...data,
        backgroundImage: data.backgroundImage === undefined ? null : data.backgroundImage
      }
      
      const result = await updateArtist(artist.id, formattedData)
      
      if (result.success) {
        toast.success('Artiste mis à jour avec succès')
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/blockchain/artists')
          router.refresh()
        }, 1000)
      } else {
        toast.error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      toast.error('Une erreur est survenue lors de la mise à jour')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/blockchain/artists')
  }
  
  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>Modifier l'artiste</h1>
          <p className={styles.formSubtitle}>
            Modifier les informations de {artist.name} {artist.surname}
          </p>
        </div>

        <div className={styles.formCard}>
          <div className={styles.cardContent}>
            <div className={styles.profileSection}>
              <div className={styles.imageSection}>
                {imageUrl ? (
                  <div className={styles.imageContainer}>
                    <Image
                      src={imageUrl}
                      alt={`${artist.name} ${artist.surname}`}
                      fill
                      className={styles.profileImage}
                    />
                  </div>
                ) : (
                  <div className={styles.placeholderImage}>
                    {artist.name.charAt(0)}{artist.surname.charAt(0)}
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label htmlFor="imageUrl" className={styles.formLabel}>URL de l'image</label>
                  <input
                    id="imageUrl"
                    type="text"
                    {...register('imageUrl')}
                    className={`${styles.formInput} ${errors.imageUrl ? styles.formInputError : ''}`}
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.imageUrl && (
                    <p className={styles.formError}>{errors.imageUrl.message}</p>
                  )}
                </div>
              </div>
              
              <div className={styles.detailsSection}>
                <div className={styles.formCheckboxGroup}>
                  <div className={styles.typeSelector}>
                    <span className={!isGallery ? styles.typeActive : ''}>Artiste</span>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        {...register('isGallery')}
                        className={styles.switchInput}
                      />
                      <span className={styles.slider}></span>
                    </label>
                    <span className={isGallery ? styles.typeActive : ''}>Galerie</span>
                  </div>
                </div>
                
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.formLabel}>Prénom</label>
                    <input
                      id="name"
                      type="text"
                      {...register('name')}
                      className={`${styles.formInput} ${errors.name ? styles.formInputError : ''}`}
                    />
                    {errors.name && (
                      <p className={styles.formError}>{errors.name.message}</p>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="surname" className={styles.formLabel}>Nom</label>
                    <input
                      id="surname"
                      type="text"
                      {...register('surname')}
                      className={`${styles.formInput} ${errors.surname ? styles.formInputError : ''}`}
                    />
                    {errors.surname && (
                      <p className={styles.formError}>{errors.surname.message}</p>
                    )}
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="pseudo" className={styles.formLabel}>Pseudo</label>
                  <input
                    id="pseudo"
                    type="text"
                    {...register('pseudo')}
                    className={`${styles.formInput} ${errors.pseudo ? styles.formInputError : ''}`}
                  />
                  {errors.pseudo && (
                    <p className={styles.formError}>{errors.pseudo.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.formCard}>
          <div className={styles.cardContent}>
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.formLabel}>Description</label>
              <textarea
                id="description"
                {...register('description')}
                className={`${styles.formTextarea} ${errors.description ? styles.formInputError : ''}`}
                rows={5}
              />
              {errors.description && (
                <p className={styles.formError}>{errors.description.message}</p>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="publicKey" className={styles.formLabel}>Clé publique</label>
              <input
                id="publicKey"
                type="text"
                {...register('publicKey')}
                className={`${styles.formInput} ${errors.publicKey ? styles.formInputError : ''}`}
              />
              {errors.publicKey && (
                <p className={styles.formError}>{errors.publicKey.message}</p>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="backgroundImage" className={styles.formLabel}>
                Image d'arrière-plan (optionnel)
              </label>
              <input
                id="backgroundImage"
                type="text"
                {...register('backgroundImage')}
                className={`${styles.formInput} ${errors.backgroundImage ? styles.formInputError : ''}`}
                placeholder="https://example.com/background.jpg"
              />
              {errors.backgroundImage && (
                <p className={styles.formError}>{errors.backgroundImage.message}</p>
              )}
            </div>
          </div>
        </div>
        
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
            {isSubmitting ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </div>
  )
} 