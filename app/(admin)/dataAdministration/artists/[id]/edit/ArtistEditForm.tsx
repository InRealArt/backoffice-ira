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
import styles from './artistEditForm.module.scss'
import CountrySelect from '@/app/components/Common/CountrySelect'
import { getCountries } from '@/lib/utils'

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
  slug: z.string().min(1, 'Le slug est requis'),
  featuredArtwork: z.string().url('URL d\'image de l\'œuvre vedette invalide'),
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
    
    // Debug: Vérifier s'il y a des champs non autorisés
    console.log('🔍 Données du formulaire d\'édition à soumettre:', data)
    const allowedFields = ['name', 'surname', 'pseudo', 'description', 'publicKey', 'imageUrl', 'isGallery', 'backgroundImage', 'slug', 'featuredArtwork', 'birthYear', 'countryCode', 'websiteUrl', 'facebookUrl', 'instagramUrl', 'twitterUrl', 'linkedinUrl']
    const extraFields = Object.keys(data).filter(key => !allowedFields.includes(key))
    if (extraFields.length > 0) {
      console.warn('⚠️ Champs non autorisés détectés dans l\'édition:', extraFields)
      console.warn('⚠️ Valeurs des champs non autorisés:', extraFields.reduce((obj, key) => ({ ...obj, [key]: (data as any)[key] }), {}))
    }
    
    try {
      // Filtrer explicitement les champs autorisés pour éviter les champs fantômes
      const cleanedData = {
        name: data.name,
        surname: data.surname,
        pseudo: data.pseudo,
        description: data.description,
        publicKey: data.publicKey,
        imageUrl: data.imageUrl,
        isGallery: data.isGallery,
        backgroundImage: data.backgroundImage,
        slug: data.slug,
        featuredArtwork: data.featuredArtwork,
        birthYear: data.birthYear,
        // countryCode: data.countryCode, // TODO: Réactiver après npx prisma generate
        websiteUrl: data.websiteUrl,
        facebookUrl: data.facebookUrl,
        instagramUrl: data.instagramUrl,
        twitterUrl: data.twitterUrl,
        linkedinUrl: data.linkedinUrl,
      }
      
      // Transformer undefined en null pour backgroundImage
      const formattedData = {
        ...cleanedData,
        backgroundImage: cleanedData.backgroundImage || null,
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
    <div className={styles['page-container']}>
      <div className={styles['page-header']}>
        <div className={styles['header-top-section']}>
          <h1 className={styles['page-title']}>Modifier l'artiste</h1>
        </div>
        <p className={styles['page-subtitle']}>
          Modifier les informations de {artist.name} {artist.surname}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles['form-container']}>
        <div className={styles['form-card']}>
          <div className={styles['card-content']}>
            <div className={styles['d-flex'] + ' ' + styles['gap-lg']}>
              <div className={styles['d-flex'] + ' ' + styles['flex-column'] + ' ' + styles['gap-md']} style={{ width: '200px' }}>
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
                <div className={styles['form-group']}>
                  <label htmlFor="imageUrl" className={styles['form-label']}>URL de l'image</label>
                  <input
                    id="imageUrl"
                    type="text"
                    {...register('imageUrl')}
                    className={`${styles['form-input']} ${errors.imageUrl ? styles['input-error'] : ''}`}
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.imageUrl && (
                    <p className={styles['form-error']}>{errors.imageUrl.message}</p>
                  )}
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <div className={styles['form-group']}>
                  <div className={styles['d-flex'] + ' ' + styles['align-items-center'] + ' ' + styles['gap-md']} style={{ marginBottom: '20px' }}>
                    <span className={isGallery ? styles['text-muted'] : styles['text-primary']} style={{ fontWeight: isGallery ? 'normal' : 'bold' }}>Artiste</span>
                    <label className={styles['d-flex'] + ' ' + styles['align-items-center']} style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px' }}>
                      <input
                        type="checkbox"
                        {...register('isGallery')}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isGallery ? '#4f46e5' : '#ccc', borderRadius: '34px', transition: '0.4s' }}>
                        <span style={{ position: 'absolute', content: '""', height: '22px', width: '22px', left: '4px', bottom: '4px', backgroundColor: 'white', borderRadius: '50%', transition: '0.4s', transform: isGallery ? 'translateX(30px)' : 'translateX(0)' }}></span>
                      </span>
                    </label>
                    <span className={isGallery ? styles['text-primary'] : styles['text-muted']} style={{ fontWeight: isGallery ? 'bold' : 'normal' }}>Galerie</span>
                  </div>

                </div>
                
                <div className={styles['d-flex'] + ' ' + styles['gap-md']}>
                  <div className={styles['form-group']} style={{ flex: 1 }}>
                    <label htmlFor="name" className={styles['form-label']}>Prénom</label>
                    <input
                      id="name"
                      type="text"
                      {...register('name')}
                      className={`${styles['form-input']} ${errors.name ? styles['input-error'] : ''}`}
                    />
                    {errors.name && (
                      <p className={styles['form-error']}>{errors.name.message}</p>
                    )}
                  </div>
                  <div className={styles['form-group']} style={{ flex: 1 }}>
                    <label htmlFor="surname" className={styles['form-label']}>Nom</label>
                    <input
                      id="surname"
                      type="text"
                      {...register('surname')}
                      className={`${styles['form-input']} ${errors.surname ? styles['input-error'] : ''}`}
                    />
                    {errors.surname && (
                      <p className={styles['form-error']}>{errors.surname.message}</p>
                    )}
                  </div>
                </div>
                
                <div className={styles['form-group']}>
                  <label htmlFor="pseudo" className={styles['form-label']}>Pseudo</label>
                  <input
                    id="pseudo"
                    type="text"
                    {...register('pseudo')}
                    className={`${styles['form-input']} ${errors.pseudo ? styles['input-error'] : ''}`}
                  />
                  {errors.pseudo && (
                    <p className={styles['form-error']}>{errors.pseudo.message}</p>
                  )}
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="slug" className={styles['form-label']}>Slug (généré automatiquement)</label>
                  <input
                    id="slug"
                    type="text"
                    {...register('slug')}
                    className={`${styles['form-input']} ${errors.slug ? styles['input-error'] : ''}`}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  />
                  {errors.slug && (
                    <p className={styles['form-error']}>{errors.slug.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles['form-card']}>
          <div className={styles['card-content']}>
            <div className={styles['form-group']}>
              <label htmlFor="description" className={styles['form-label']}>Description</label>
              <textarea
                id="description"
                {...register('description')}
                className={`${styles['form-textarea']} ${errors.description ? styles['input-error'] : ''}`}
                rows={5}
              />
              {errors.description && (
                <p className={styles['form-error']}>{errors.description.message}</p>
              )}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="publicKey" className={styles['form-label']}>Clé publique</label>
              <input
                id="publicKey"
                type="text"
                {...register('publicKey')}
                className={`${styles['form-input']} ${errors.publicKey ? styles['input-error'] : ''}`}
              />
              {errors.publicKey && (
                <p className={styles['form-error']}>{errors.publicKey.message}</p>
              )}
            </div>
            
          </div>
        </div>

        {/* Section Biographie */}
        <div className={styles['form-card']}>
          <div className={styles['card-content']}>
            <h3 className={styles['section-title']}>Biographie</h3>
            <div className={styles['d-flex'] + ' ' + styles['gap-md']}>
              <div className={styles['form-group']} style={{ flex: 1 }}>
                <label htmlFor="birthYear" className={styles['form-label']}>Année de naissance</label>
                <input
                  id="birthYear"
                  type="number"
                  {...register('birthYear', { valueAsNumber: true })}
                  className={`${styles['form-input']} ${errors.birthYear ? styles['input-error'] : ''}`}
                  placeholder="1990"
                  min="1900"
                  max={new Date().getFullYear()}
                />
                {errors.birthYear && (
                  <p className={styles['form-error']}>{errors.birthYear.message}</p>
                )}
              </div>
              <div className={styles['form-group']} style={{ flex: 1 }}>
                <label htmlFor="countryCode" className={styles['form-label']}>Code pays</label>
                <CountrySelect
                  countries={getCountries()}
                  value={countryCode || ''}
                  onChange={(code) => setValue('countryCode', code)}
                  placeholder="Sélectionner un pays"
                />
                {errors.countryCode && (
                  <p className={styles['form-error']}>{errors.countryCode.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Réseaux sociaux */}
        <div className={styles['form-card']}>
          <div className={styles['card-content']}>
            <h3 className={styles['section-title']}>Réseaux sociaux</h3>
            <div className={styles['form-group']}>
              <label htmlFor="websiteUrl" className={styles['form-label']}>Site web</label>
              <input
                id="websiteUrl"
                type="url"
                {...register('websiteUrl')}
                className={`${styles['form-input']} ${errors.websiteUrl ? styles['input-error'] : ''}`}
                placeholder="https://www.example.com"
              />
              {errors.websiteUrl && (
                <p className={styles['form-error']}>{errors.websiteUrl.message}</p>
              )}
            </div>
            
            <div className={styles['d-flex'] + ' ' + styles['gap-md']}>
              <div className={styles['form-group']} style={{ flex: 1 }}>
                <label htmlFor="facebookUrl" className={styles['form-label']}>Facebook</label>
                <input
                  id="facebookUrl"
                  type="url"
                  {...register('facebookUrl')}
                  className={`${styles['form-input']} ${errors.facebookUrl ? styles['input-error'] : ''}`}
                  placeholder="https://facebook.com/profile"
                />
                {errors.facebookUrl && (
                  <p className={styles['form-error']}>{errors.facebookUrl.message}</p>
                )}
              </div>
              <div className={styles['form-group']} style={{ flex: 1 }}>
                <label htmlFor="instagramUrl" className={styles['form-label']}>Instagram</label>
                <input
                  id="instagramUrl"
                  type="url"
                  {...register('instagramUrl')}
                  className={`${styles['form-input']} ${errors.instagramUrl ? styles['input-error'] : ''}`}
                  placeholder="https://instagram.com/profile"
                />
                {errors.instagramUrl && (
                  <p className={styles['form-error']}>{errors.instagramUrl.message}</p>
                )}
              </div>
            </div>
            
            <div className={styles['d-flex'] + ' ' + styles['gap-md']}>
              <div className={styles['form-group']} style={{ flex: 1 }}>
                <label htmlFor="twitterUrl" className={styles['form-label']}>Twitter</label>
                <input
                  id="twitterUrl"
                  type="url"
                  {...register('twitterUrl')}
                  className={`${styles['form-input']} ${errors.twitterUrl ? styles['input-error'] : ''}`}
                  placeholder="https://twitter.com/profile"
                />
                {errors.twitterUrl && (
                  <p className={styles['form-error']}>{errors.twitterUrl.message}</p>
                )}
              </div>
              <div className={styles['form-group']} style={{ flex: 1 }}>
                <label htmlFor="linkedinUrl" className={styles['form-label']}>LinkedIn</label>
                <input
                  id="linkedinUrl"
                  type="url"
                  {...register('linkedinUrl')}
                  className={`${styles['form-input']} ${errors.linkedinUrl ? styles['input-error'] : ''}`}
                  placeholder="https://linkedin.com/in/profile"
                />
                {errors.linkedinUrl && (
                  <p className={styles['form-error']}>{errors.linkedinUrl.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles['form-actions']}>
          <button 
            type="button" 
            onClick={handleCancel}
            className={`${styles.btn} ${styles['btn-secondary']} ${styles['btn-medium']}`}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className={`${styles.btn} ${styles['btn-primary']} ${styles['btn-medium']}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mise à jour en cours...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  )
} 