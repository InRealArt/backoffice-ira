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
import CountrySelect from '@/app/components/Common/CountrySelect'
import { getCountries } from '@/lib/utils'
import ArtistImageUpload from '@/app/(protected)/art/create-artist-profile/ArtistImageUpload'

// Schéma de validation
const formSchema = z.object({
  name: z.string().min(1, 'Le prénom est requis'),
  surname: z.string().min(1, 'Le nom est requis'),
  pseudo: z.string().min(1, 'Le pseudo est requis'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  publicKey: z.string().min(1, 'La clé publique est requise'),
  imageUrl: z.union([
    z.string().url('URL d\'image invalide'),
    z.string().length(0),
    z.null(),
    z.undefined()
  ]).optional(),
  isGallery: z.boolean().default(false),
  backgroundImage: z.string().optional().or(z.literal('')).nullable(),
  slug: z.string().min(1, 'Le slug est requis'),
  featuredArtwork: z.string().optional().or(z.literal('')).nullable(),
  // Nouveaux champs biographie
  birthYear: z.number().min(1900, 'L\'année de naissance doit être supérieure à 1900').max(new Date().getFullYear(), 'L\'année de naissance ne peut pas être dans le futur').nullable().optional(),
  countryCode: z.string().min(2, 'Le code pays doit contenir au moins 2 caractères').max(3, 'Le code pays ne peut pas dépasser 3 caractères').nullable().optional(),
  // Nouveaux champs réseaux sociaux
  websiteUrl: z.string().url('URL de site web invalide').nullable().optional().or(z.literal('')),
  facebookUrl: z.string().url('URL Facebook invalide').nullable().optional().or(z.literal('')),
  instagramUrl: z.string().url('URL Instagram invalide').nullable().optional().or(z.literal('')),
  twitterUrl: z.string().url('URL Twitter invalide').nullable().optional().or(z.literal('')),
  linkedinUrl: z.string().url('URL LinkedIn invalide').nullable().optional().or(z.literal('')),
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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
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
      publicKey: artist.publicKey,
      imageUrl: artist.imageUrl,
      isGallery: artist.isGallery || false,
      backgroundImage: artist.backgroundImage || null,
      slug: artist.slug || '',
      featuredArtwork: artist.featuredArtwork || '',
      // Nouveaux champs biographie
      birthYear: artist.birthYear || null,
      countryCode: artist.countryCode || null,
      // Nouveaux champs réseaux sociaux
      websiteUrl: artist.websiteUrl || '',
      facebookUrl: artist.facebookUrl || '',
      instagramUrl: artist.instagramUrl || '',
      twitterUrl: artist.twitterUrl || '',
      linkedinUrl: artist.linkedinUrl || '',
    }
  })

  const isGallery = watch('isGallery')
  const imageUrl = watch('imageUrl')
  const watchedName = watch('name')
  const watchedSurname = watch('surname')
  const currentSlug = watch('slug')
  const countryCode = watch('countryCode')
  
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
    
    // Debug: Vérifier les données du formulaire
    console.log('🔍 Données du formulaire d\'édition à soumettre:', data)
    
    try {
      let finalImageUrl = data.imageUrl || artist.imageUrl

      // Si un nouveau fichier a été sélectionné, l'uploader vers Firebase
      if (selectedImageFile) {
        try {
          const { uploadArtistImageWithWebP } = await import('@/lib/firebase/storage')
          
          finalImageUrl = await uploadArtistImageWithWebP(selectedImageFile, {
            name: data.name,
            surname: data.surname,
            imageType: 'profile',
            normalizeFolderName: false
          })
          
          success('Image uploadée avec succès')
        } catch (uploadError: any) {
          error('Erreur lors de l\'upload de l\'image: ' + (uploadError.message || 'Erreur inconnue'))
          setIsSubmitting(false)
          return
        }
      }

      // Filtrer explicitement les champs autorisés pour éviter les champs fantômes
      const cleanedData = {
        name: data.name,
        surname: data.surname,
        pseudo: data.pseudo,
        description: data.description,
        publicKey: data.publicKey,
        imageUrl: finalImageUrl,
        isGallery: data.isGallery,
        backgroundImage: data.backgroundImage,
        slug: data.slug,
        featuredArtwork: data.featuredArtwork,
        birthYear: data.birthYear,
        countryCode: data.countryCode,
        websiteUrl: data.websiteUrl,
        facebookUrl: data.facebookUrl,
        instagramUrl: data.instagramUrl,
        twitterUrl: data.twitterUrl,
        linkedinUrl: data.linkedinUrl,
      }
      
      // Transformer undefined et chaînes vides en null pour les champs optionnels
      const formattedData = {
        ...cleanedData,
        backgroundImage: cleanedData.backgroundImage || null,
        featuredArtwork: cleanedData.featuredArtwork || null,
        websiteUrl: cleanedData.websiteUrl || null,
        facebookUrl: cleanedData.facebookUrl || null,
        instagramUrl: cleanedData.instagramUrl || null,
        twitterUrl: cleanedData.twitterUrl || null,
        linkedinUrl: cleanedData.linkedinUrl || null,
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
    <div className="max-w-6xl mx-auto p-xxl">
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
            <div className="flex gap-xxl">
              <div className="flex flex-col gap-md" style={{ width: '200px' }}>
                <ArtistImageUpload
                  onFileSelect={(file) => {
                    setSelectedImageFile(file)
                    if (file) {
                      // Créer une preview locale
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setValue('imageUrl', reader.result as string, { shouldValidate: false })
                      }
                      reader.readAsDataURL(file)
                    } else {
                      setValue('imageUrl', artist.imageUrl || '', { shouldValidate: false })
                    }
                  }}
                  previewUrl={imageUrl || artist.imageUrl || null}
                  error={errors.imageUrl?.message}
                  allowDelete={false}
                />
              </div>
              
              <div className="flex-1">
                <div className="form-group">
                  <div className="flex items-center gap-md mb-5">
                    <span className={isGallery ? 'text-text-secondary' : 'text-primary font-bold'}>Artiste</span>
                    <label className="relative w-[60px] h-[30px]">
                      <input
                        type="checkbox"
                        {...register('isGallery')}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isGallery ? '#4f46e5' : '#ccc', borderRadius: '34px', transition: '0.4s' }}>
                        <span style={{ position: 'absolute', content: '""', height: '22px', width: '22px', left: '4px', bottom: '4px', backgroundColor: 'white', borderRadius: '50%', transition: '0.4s', transform: isGallery ? 'translateX(30px)' : 'translateX(0)' }}></span>
                      </span>
                    </label>
                    <span className={isGallery ? 'text-primary font-bold' : 'text-text-secondary'}>Galerie</span>
                  </div>

                </div>
                
                <div className="flex gap-md">
                  <div className="form-group flex-1">
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
                  <div className="form-group flex-1">
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
                    className={`form-input form-readonly ${errors.slug ? 'input-error' : ''}`}
                    readOnly
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

        {/* Section Biographie */}
        <div className="form-card">
          <div className="card-content">
            <h3 className="section-title">Biographie</h3>
            <div className="flex gap-md">
              <div className="form-group flex-1">
                <label htmlFor="birthYear" className="form-label">Année de naissance</label>
                <input
                  id="birthYear"
                  type="number"
                  {...register('birthYear', { valueAsNumber: true })}
                  className={`form-input ${errors.birthYear ? 'input-error' : ''}`}
                  placeholder="1990"
                  min="1900"
                  max={new Date().getFullYear()}
                />
                {errors.birthYear && (
                  <p className="form-error">{errors.birthYear.message}</p>
                )}
              </div>
              <div className="form-group flex-1" style={{ position: 'relative', zIndex: 1 }}>
                <label htmlFor="countryCode" className="form-label">Code pays</label>
                <div style={{ position: 'relative' }}>
                  <CountrySelect
                    countries={getCountries()}
                    value={countryCode || ''}
                    onChange={(code) => setValue('countryCode', code)}
                    placeholder="Sélectionner un pays"
                  />
                </div>
                {errors.countryCode && (
                  <p className="form-error">{errors.countryCode.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Réseaux sociaux */}
        <div className="form-card">
          <div className="card-content">
            <h3 className="section-title">Réseaux sociaux</h3>
            <div className="form-group">
              <label htmlFor="websiteUrl" className="form-label">Site web</label>
              <input
                id="websiteUrl"
                type="url"
                {...register('websiteUrl')}
                className={`form-input ${errors.websiteUrl ? 'input-error' : ''}`}
                placeholder="https://www.example.com"
              />
              {errors.websiteUrl && (
                <p className="form-error">{errors.websiteUrl.message}</p>
              )}
            </div>
            
            <div className="flex gap-md">
              <div className="form-group flex-1">
                <label htmlFor="facebookUrl" className="form-label">Facebook</label>
                <input
                  id="facebookUrl"
                  type="url"
                  {...register('facebookUrl')}
                  className={`form-input ${errors.facebookUrl ? 'input-error' : ''}`}
                  placeholder="https://facebook.com/profile"
                />
                {errors.facebookUrl && (
                  <p className="form-error">{errors.facebookUrl.message}</p>
                )}
              </div>
              <div className="form-group flex-1">
                <label htmlFor="instagramUrl" className="form-label">Instagram</label>
                <input
                  id="instagramUrl"
                  type="url"
                  {...register('instagramUrl')}
                  className={`form-input ${errors.instagramUrl ? 'input-error' : ''}`}
                  placeholder="https://instagram.com/profile"
                />
                {errors.instagramUrl && (
                  <p className="form-error">{errors.instagramUrl.message}</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-md">
              <div className="form-group flex-1">
                <label htmlFor="twitterUrl" className="form-label">Twitter</label>
                <input
                  id="twitterUrl"
                  type="url"
                  {...register('twitterUrl')}
                  className={`form-input ${errors.twitterUrl ? 'input-error' : ''}`}
                  placeholder="https://twitter.com/profile"
                />
                {errors.twitterUrl && (
                  <p className="form-error">{errors.twitterUrl.message}</p>
                )}
              </div>
              <div className="form-group flex-1">
                <label htmlFor="linkedinUrl" className="form-label">LinkedIn</label>
                <input
                  id="linkedinUrl"
                  type="url"
                  {...register('linkedinUrl')}
                  className={`form-input ${errors.linkedinUrl ? 'input-error' : ''}`}
                  placeholder="https://linkedin.com/in/profile"
                />
                {errors.linkedinUrl && (
                  <p className="form-error">{errors.linkedinUrl.message}</p>
                )}
              </div>
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