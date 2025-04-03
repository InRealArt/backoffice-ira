'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus } from 'lucide-react'
import { createLandingArtistAction } from '@/lib/actions/landing-artist-actions'
import TranslationField from '@/app/components/TranslationField'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import { generateSlug } from '@/lib/utils'

// Schéma de validation
const formSchema = z.object({
  artistId: z.string().min(1, 'Veuillez sélectionner un artiste'),
  intro: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  artworkStyle: z.string().nullable().optional(),
  artistsPage: z.boolean().default(false),
  imageUrl: z.string().url('URL d\'image invalide'),
  websiteUrl: z.string().refine(
    val => val === '' || /^https?:\/\//.test(val),
    { message: 'URL invalide' }
  ).optional().transform(val => val === '' ? null : val),
  facebookUrl: z.string().refine(
    val => val === '' || /^https?:\/\//.test(val),
    { message: 'URL Facebook invalide' }
  ).optional().transform(val => val === '' ? null : val),
  instagramUrl: z.string().refine(
    val => val === '' || /^https?:\/\//.test(val),
    { message: 'URL Instagram invalide' }
  ).optional().transform(val => val === '' ? null : val),
  twitterUrl: z.string().refine(
    val => val === '' || /^https?:\/\//.test(val),
    { message: 'URL Twitter invalide' }
  ).optional().transform(val => val === '' ? null : val),
  linkedinUrl: z.string().refine(
    val => val === '' || /^https?:\/\//.test(val),
    { message: 'URL LinkedIn invalide' }
  ).optional().transform(val => val === '' ? null : val),
  slug: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// Fonction pour normaliser une chaîne (supprimer accents et mettre en minuscules)
// const normalizeString = (str: string) => {
//   return str
//     .normalize('NFD')
//     .replace(/[\u0300-\u036f]/g, '')
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, '-')
//     .replace(/^-|-$/g, '')
// }

// Fonction pour générer un slug à partir du prénom et nom
// const generateSlug = (name: string, surname: string) => {
//   return `${normalizeString(name)}-${normalizeString(surname)}`
// }

interface Artist {
  id: number
  name: string
  surname: string
  pseudo: string
  imageUrl: string
}

interface CreateLandingArtistFormProps {
  artists: Artist[]
}

export default function CreateLandingArtistForm({ artists }: CreateLandingArtistFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [artworkImages, setArtworkImages] = useState<{name: string, url: string}[]>([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageName, setNewImageName] = useState('')
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [slug, setSlug] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      artistId: '',
      intro: '',
      description: '',
      artworkStyle: '',
      artistsPage: false,
      imageUrl: '',
      websiteUrl: '',
      facebookUrl: '',
      instagramUrl: '',
      twitterUrl: '',
      linkedinUrl: '',
      slug: '',
    }
  })

  const artistId = watch('artistId')
  const imageUrl = watch('imageUrl')
  const artistsPage = watch('artistsPage')

  // Mettre à jour l'artiste sélectionné lorsque l'ID change
  const handleArtistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value)
    const artist = artists.find(a => a.id === id) || null
    setSelectedArtist(artist)
    
    if (artist && !imageUrl) {
      // Pré-remplir l'URL de l'image avec celle de l'artiste si aucune URL n'est encore définie
      setValue('imageUrl', artist.imageUrl)
    }
    
    // Générer et mettre à jour le slug
    if (artist) {
      const generatedSlug = generateSlug(artist.name, artist.surname)
      setSlug(generatedSlug)
      setValue('slug', generatedSlug)
    } else {
      setSlug('')
      setValue('slug', '')
    }
  }
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Transformer undefined en null pour certains champs
      const formattedData = {
        artistId: parseInt(data.artistId),
        intro: data.intro || null,
        description: data.description || null,
        artworkStyle: data.artworkStyle || null,
        artistsPage: data.artistsPage,
        imageUrl: data.imageUrl,
        websiteUrl: data.websiteUrl || null,
        facebookUrl: data.facebookUrl || null, 
        instagramUrl: data.instagramUrl || null,
        twitterUrl: data.twitterUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        artworkImages: JSON.stringify(artworkImages),
        slug: data.slug
      }
      
      // Appel à la server action pour créer l'artiste
      const result = await createLandingArtistAction(formattedData)
      
      if (result.success) {
        toast.success('Artiste ajouté avec succès')
        
        // Gestion des traductions pour intro et description
        try {
          if (result.landingArtist?.id) {
            await handleEntityTranslations('LandingArtist', result.landingArtist.id, {
              intro: data.intro || null,
              description: data.description || null,
              artworkStyle: data.artworkStyle || null
            })
          }
        } catch (translationError) {
          console.error('Erreur lors de la gestion des traductions:', translationError)
          // On ne bloque pas la création en cas d'erreur de traduction
        }
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/landing/landingArtists')
          router.refresh()
        }, 1000)
      } else {
        toast.error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      toast.error('Une erreur est survenue lors de la création')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/landing/landingArtists')
  }
  
  const handleAddImage = () => {
    if (newImageUrl.trim() === '') return;
    
    // Ajouter la nouvelle image à la liste
    setArtworkImages([...artworkImages, { name: newImageName, url: newImageUrl }]);
    
    // Réinitialiser les champs
    setNewImageUrl('');
    setNewImageName('');
  }
  
  const handleRemoveImage = (index: number) => {
    const updatedImages = [...artworkImages];
    updatedImages.splice(index, 1);
    setArtworkImages(updatedImages);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Ajouter un artiste à la page d'accueil</h1>
        </div>
        <p className="page-subtitle">
          Sélectionnez un artiste et configurez son affichage sur la page d'accueil
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            <div className="form-group">
              <label htmlFor="artistId" className="form-label">Sélectionnez un artiste</label>
              <select
                id="artistId"
                {...register('artistId')}
                className={`form-select ${errors.artistId ? 'input-error' : ''}`}
                onChange={handleArtistChange}
              >
                <option value="">-- Sélectionner un artiste --</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name} {artist.surname} ({artist.pseudo})
                  </option>
                ))}
              </select>
              {errors.artistId && (
                <p className="form-error">{errors.artistId.message}</p>
              )}
            </div>
            
            {selectedArtist && (
              <>
                <div className="form-group mt-md">
                  <label htmlFor="slug" className="form-label">Slug</label>
                  <input
                    id="slug"
                    type="text"
                    value={slug}
                    readOnly
                    className="form-input"
                    style={{ backgroundColor: '#f9f9f9' }}
                  />
                  <p className="form-hint">Généré automatiquement à partir du nom de l'artiste</p>
                </div>
                
                <div className="d-flex gap-lg mt-lg">
                  <div className="d-flex flex-column gap-md" style={{ width: '200px' }}>
                    {imageUrl ? (
                      <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '8px', overflow: 'hidden' }}>
                        <img
                          src={imageUrl}
                          alt={selectedArtist ? `${selectedArtist.name} ${selectedArtist.surname}` : 'Artiste'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div style={{ width: '200px', height: '200px', borderRadius: '8px', backgroundColor: '#e0e0e0', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '1.5rem' }}>
                        {selectedArtist.name.charAt(0)}{selectedArtist.surname.charAt(0)}
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
                        <span className={!artistsPage ? 'text-primary' : 'text-muted'} style={{ fontWeight: !artistsPage ? 'bold' : 'normal' }}>Non affiché</span>
                        <label className="d-flex align-items-center" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px' }}>
                          <input
                            type="checkbox"
                            {...register('artistsPage')}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: artistsPage ? '#4f46e5' : '#ccc', borderRadius: '34px', transition: '0.4s' }}>
                            <span style={{ position: 'absolute', content: '""', height: '22px', width: '22px', left: '4px', bottom: '4px', backgroundColor: 'white', borderRadius: '50%', transition: '0.4s', transform: artistsPage ? 'translateX(30px)' : 'translateX(0)' }}></span>
                          </span>
                        </label>
                        <span className={artistsPage ? 'text-primary' : 'text-muted'} style={{ fontWeight: artistsPage ? 'bold' : 'normal' }}>Affiché</span>
                      </div>
                    </div>
                    
                    <TranslationField
                      entityType="LandingArtist"
                      entityId={null}
                      field="intro"
                      label="Introduction"
                      errorMessage={errors.intro?.message}
                    >
                      <textarea
                        id="intro"
                        {...register('intro')}
                        className={`form-textarea ${errors.intro ? 'input-error' : ''}`}
                        rows={3}
                        placeholder="Courte introduction de l'artiste qui sera affichée sur la page d'accueil"
                      />
                    </TranslationField>
                    
                    <TranslationField
                      entityType="LandingArtist"
                      entityId={null}
                      field="description"
                      label="Description"
                      errorMessage={errors.description?.message}
                    >
                      <textarea
                        id="description"
                        {...register('description')}
                        className={`form-textarea ${errors.description ? 'input-error' : ''}`}
                        rows={5}
                        placeholder="Description complète de l'artiste"
                      />
                    </TranslationField>
                    
                    <TranslationField
                      entityType="LandingArtist"
                      entityId={null}
                      field="artworkStyle"
                      label="Style artistique"
                      errorMessage={errors.artworkStyle?.message}
                    >
                      <input
                        id="artworkStyle"
                        type="text"
                        {...register('artworkStyle')}
                        className={`form-input ${errors.artworkStyle ? 'input-error' : ''}`}
                        placeholder="Style artistique (ex: Peinture contemporaine, Photographie, etc.)"
                      />
                    </TranslationField>
                  </div>
                </div>
                
                <div className="form-section mt-lg">
                  <h2 className="section-title">Images des œuvres</h2>
                  <p className="section-subtitle">Ajoutez les images des œuvres qui seront affichées sur la page d'accueil</p>
                  
                  <div className="form-group mt-md">
                    <div className="d-flex gap-md mb-md">
                      <div style={{ flex: 2 }}>
                        <label htmlFor="newImageName" className="form-label">Nom de l'œuvre</label>
                        <input
                          id="newImageName"
                          type="text"
                          value={newImageName}
                          onChange={(e) => setNewImageName(e.target.value)}
                          className="form-input"
                          placeholder="Nom de l'œuvre (optionnel)"
                        />
                      </div>
                      <div style={{ flex: 3 }}>
                        <label htmlFor="newImageUrl" className="form-label">URL de l'image</label>
                        <div className="d-flex gap-sm">
                          <input
                            id="newImageUrl"
                            type="text"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            className="form-input"
                            placeholder="https://example.com/image.jpg"
                          />
                          <button
                            type="button"
                            onClick={handleAddImage}
                            disabled={!newImageUrl}
                            className="btn btn-primary btn-medium"
                            aria-label="Ajouter une image"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="image-list mt-md">
                      {artworkImages.length === 0 ? (
                        <p className="text-muted">Aucune image ajoutée</p>
                      ) : (
                        <div className="d-flex flex-wrap gap-md">
                          {artworkImages.map((image, index) => (
                            <div key={index} className="image-item" style={{ position: 'relative', width: '150px' }}>
                              <div style={{ position: 'relative', width: '150px', height: '150px', borderRadius: '8px', overflow: 'hidden' }}>
                                <img
                                  src={image.url}
                                  alt={image.name || `Image ${index + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="btn btn-danger btn-small"
                                style={{ position: 'absolute', top: '5px', right: '5px', padding: '4px', borderRadius: '50%' }}
                                aria-label="Supprimer l'image"
                              >
                                <X size={16} />
                              </button>
                              {image.name && (
                                <p className="image-name mt-xs" style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {image.name}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-section mt-lg">
                  <h2 className="section-title">Liens de réseaux sociaux</h2>
                  <p className="section-subtitle">Ajoutez les liens vers les réseaux sociaux et site web de l'artiste</p>
                  
                  <div className="form-group mt-md">
                    <label htmlFor="websiteUrl" className="form-label">Site web</label>
                    <input
                      id="websiteUrl"
                      type="text"
                      {...register('websiteUrl')}
                      className={`form-input ${errors.websiteUrl ? 'input-error' : ''}`}
                      placeholder="https://site-web-artiste.com"
                    />
                    {errors.websiteUrl && (
                      <p className="form-error">{errors.websiteUrl.message}</p>
                    )}
                  </div>
                  
                  <div className="d-flex gap-md mt-md">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="facebookUrl" className="form-label">Facebook</label>
                      <input
                        id="facebookUrl"
                        type="text"
                        {...register('facebookUrl')}
                        className={`form-input ${errors.facebookUrl ? 'input-error' : ''}`}
                        placeholder="https://facebook.com/username"
                      />
                      {errors.facebookUrl && (
                        <p className="form-error">{errors.facebookUrl.message}</p>
                      )}
                    </div>
                    
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="instagramUrl" className="form-label">Instagram</label>
                      <input
                        id="instagramUrl"
                        type="text"
                        {...register('instagramUrl')}
                        className={`form-input ${errors.instagramUrl ? 'input-error' : ''}`}
                        placeholder="https://instagram.com/username"
                      />
                      {errors.instagramUrl && (
                        <p className="form-error">{errors.instagramUrl.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="d-flex gap-md mt-md">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="twitterUrl" className="form-label">Twitter</label>
                      <input
                        id="twitterUrl"
                        type="text"
                        {...register('twitterUrl')}
                        className={`form-input ${errors.twitterUrl ? 'input-error' : ''}`}
                        placeholder="https://twitter.com/username"
                      />
                      {errors.twitterUrl && (
                        <p className="form-error">{errors.twitterUrl.message}</p>
                      )}
                    </div>
                    
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="linkedinUrl" className="form-label">LinkedIn</label>
                      <input
                        id="linkedinUrl"
                        type="text"
                        {...register('linkedinUrl')}
                        className={`form-input ${errors.linkedinUrl ? 'input-error' : ''}`}
                        placeholder="https://linkedin.com/in/username"
                      />
                      {errors.linkedinUrl && (
                        <p className="form-error">{errors.linkedinUrl.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="card-footer">
            <div className="d-flex justify-content-between">
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
                disabled={isSubmitting || !selectedArtist}
              >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
} 