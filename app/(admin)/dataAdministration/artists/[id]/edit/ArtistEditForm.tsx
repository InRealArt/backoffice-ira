'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Artist } from '@prisma/client'
import { updateArtist } from '@/lib/actions/artist-actions'
import { useToast } from '@/app/components/Toast/ToastContext'
import Image from 'next/image'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus } from 'lucide-react'
import { generateSlug } from '@/lib/utils'

// Schéma de validation
const formSchema = z.object({
  name: z.string().min(1, 'Le prénom est requis'),
  surname: z.string().min(1, 'Le nom est requis'),
  pseudo: z.string().min(1, 'Le pseudo est requis'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  artworkStyle: z.string().nullable().optional(),
  publicKey: z.string().min(1, 'La clé publique est requise'),
  imageUrl: z.string().url('URL d\'image invalide'),
  isGallery: z.boolean().default(false),
  backgroundImage: z.string().url('URL d\'image d\'arrière-plan invalide').nullable().optional(),
  slug: z.string().min(1, 'Le slug est requis'),
  featuredArtwork: z.string().url('URL d\'image de l\'œuvre vedette invalide'),
})

type FormValues = z.infer<typeof formSchema>


interface ArtistEditFormProps {
  artist: Artist & { artworkImages?: string[] | {name: string, url: string}[] }
}

export default function ArtistEditForm({ artist }: ArtistEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageName, setNewImageName] = useState('')
  const { success, error } = useToast()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: artist.name,
      surname: artist.surname,
      pseudo: artist.pseudo,
      description: artist.description,
      artworkStyle: artist.artworkStyle || '',
      publicKey: artist.publicKey,
      imageUrl: artist.imageUrl,
      isGallery: artist.isGallery || false,
      backgroundImage: artist.backgroundImage || null,
      slug: artist.slug || '',
      featuredArtwork: artist.featuredArtwork || '',
    }
  })

  const isGallery = watch('isGallery')
  const imageUrl = watch('imageUrl')
  const watchedName = watch('name')
  const watchedSurname = watch('surname')
  const currentSlug = watch('slug')
  
  // Génération automatique du slug
  useEffect(() => {
    if (watchedName && watchedSurname) {
      const newSlug = generateSlug(watchedName + ' ' + watchedSurname)
      if (newSlug !== currentSlug) {
        setValue('slug', newSlug, { shouldValidate: true })
      }
    }
  }, [watchedName, watchedSurname, setValue, currentSlug])
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Transformer undefined en null pour backgroundImage
      const formattedData = {
        ...data,
        artworkStyle: data.artworkStyle || null,
        backgroundImage: data.backgroundImage || null,
        countryCode: artist.countryCode, // Préserver le countryCode existant
      }
      
      const result = await updateArtist(artist.id, formattedData)
      
      if (result.success) {
        success('Artiste mis à jour avec succès')
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/dataAdministration/artists')
          router.refresh()
        }, 1000)
      } else {
        error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      error('Une erreur est survenue lors de la mise à jour')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/dataAdministration/artists')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Modifier l'artiste</h1>
        </div>
        <p className="page-subtitle">
          Modifier les informations de {artist.name} {artist.surname}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            <div className="d-flex gap-lg">
              <div className="d-flex flex-column gap-md" style={{ width: '200px' }}>
                {imageUrl ? (
                  <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '8px', overflow: 'hidden' }}>
                    <Image
                      src={imageUrl}
                      alt={`${artist.name} ${artist.surname}`}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '200px', height: '200px', borderRadius: '8px', backgroundColor: '#e0e0e0', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '1.5rem' }}>
                    {artist.name.charAt(0)}{artist.surname.charAt(0)}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="imageUrl" className="form-label">URL de l'image</label>
                  <input
                    id="imageUrl"
                    type="text"
                    {...register('imageUrl')}
                    className={`form-input ${errors.imageUrl ? 'input-error' : ''}`}
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.imageUrl && (
                    <p className="form-error">{errors.imageUrl.message}</p>
                  )}
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <div className="form-group">
                  <div className="d-flex align-items-center gap-md" style={{ marginBottom: '20px' }}>
                    <span className={isGallery ? 'text-muted' : 'text-primary'} style={{ fontWeight: isGallery ? 'normal' : 'bold' }}>Artiste</span>
                    <label className="d-flex align-items-center" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px' }}>
                      <input
                        type="checkbox"
                        {...register('isGallery')}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isGallery ? '#4f46e5' : '#ccc', borderRadius: '34px', transition: '0.4s' }}>
                        <span style={{ position: 'absolute', content: '""', height: '22px', width: '22px', left: '4px', bottom: '4px', backgroundColor: 'white', borderRadius: '50%', transition: '0.4s', transform: isGallery ? 'translateX(30px)' : 'translateX(0)' }}></span>
                      </span>
                    </label>
                    <span className={isGallery ? 'text-primary' : 'text-muted'} style={{ fontWeight: isGallery ? 'bold' : 'normal' }}>Galerie</span>
                  </div>

                </div>
                
                <div className="d-flex gap-md">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="name" className="form-label">Prénom</label>
                    <input
                      id="name"
                      type="text"
                      {...register('name')}
                      className={`form-input ${errors.name ? 'input-error' : ''}`}
                    />
                    {errors.name && (
                      <p className="form-error">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="surname" className="form-label">Nom</label>
                    <input
                      id="surname"
                      type="text"
                      {...register('surname')}
                      className={`form-input ${errors.surname ? 'input-error' : ''}`}
                    />
                    {errors.surname && (
                      <p className="form-error">{errors.surname.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="pseudo" className="form-label">Pseudo</label>
                  <input
                    id="pseudo"
                    type="text"
                    {...register('pseudo')}
                    className={`form-input ${errors.pseudo ? 'input-error' : ''}`}
                  />
                  {errors.pseudo && (
                    <p className="form-error">{errors.pseudo.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="slug" className="form-label">Slug (généré automatiquement)</label>
                  <input
                    id="slug"
                    type="text"
                    {...register('slug')}
                    className={`form-input ${errors.slug ? 'input-error' : ''}`}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  />
                  {errors.slug && (
                    <p className="form-error">{errors.slug.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-card">
          <div className="card-content">
            <div className="form-group">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                {...register('description')}
                className={`form-textarea ${errors.description ? 'input-error' : ''}`}
                rows={5}
              />
              {errors.description && (
                <p className="form-error">{errors.description.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="artworkStyle" className="form-label">Style d'art</label>
              <input
                id="artworkStyle"
                type="text"
                {...register('artworkStyle')}
                className={`form-input ${errors.artworkStyle ? 'input-error' : ''}`}
              />
              {errors.artworkStyle && (
                <p className="form-error">{errors.artworkStyle.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="featuredArtwork" className="form-label">Œuvre vedette (URL)</label>
              <input
                id="featuredArtwork"
                type="text"
                {...register('featuredArtwork')}
                className={`form-input ${errors.featuredArtwork ? 'input-error' : ''}`}
                placeholder="https://example.com/featured-artwork.jpg"
              />
              {errors.featuredArtwork && (
                <p className="form-error">{errors.featuredArtwork.message}</p>
              )}
              <p className="form-help-text">Cette image sera utilisée comme carte de l'artiste sur la marketplace</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="publicKey" className="form-label">Clé publique</label>
              <input
                id="publicKey"
                type="text"
                {...register('publicKey')}
                className={`form-input ${errors.publicKey ? 'input-error' : ''}`}
              />
              {errors.publicKey && (
                <p className="form-error">{errors.publicKey.message}</p>
              )}
            </div>
            
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleCancel}
            className="btn btn-secondary btn-medium"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="btn btn-primary btn-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mise à jour en cours...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  )
} 