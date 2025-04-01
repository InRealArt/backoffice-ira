'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus } from 'lucide-react'
import { updateLandingArtistAction } from '@/lib/actions/landing-artist-actions'

// Schéma de validation
const formSchema = z.object({
  intro: z.string().nullable().optional(),
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
})

type FormValues = z.infer<typeof formSchema>

interface LandingArtistWithArtist {
  id: number
  intro: string | null
  artworkImages: any
  artworkStyle: string | null
  artistsPage: boolean | null
  imageUrl: string
  artistId: number
  websiteUrl: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  twitterUrl: string | null
  linkedinUrl: string | null
  artist: {
    id: number
    name: string
    surname: string
    pseudo: string
  }
}

interface LandingArtistEditFormProps {
  landingArtist: LandingArtistWithArtist
}

export default function LandingArtistEditForm({ landingArtist }: LandingArtistEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [artworkImages, setArtworkImages] = useState<{name: string, url: string}[]>(() => {
    // Parse le champ artworkImages qui peut être une chaîne JSON ou un tableau
    if (!landingArtist.artworkImages) {
      return [];
    }
    
    if (typeof landingArtist.artworkImages === 'string') {
      try {
        const parsed = JSON.parse(landingArtist.artworkImages);
        // Conversion d'anciens formats (simples URLs) vers le nouveau format {name, url}
        if (Array.isArray(parsed)) {
          return parsed.map(item => {
            if (typeof item === 'string') {
              return { name: '', url: item };
            } else if (typeof item === 'object' && item.url) {
              return item;
            }
            return { name: '', url: '' };
          });
        }
        return [];
      } catch (e) {
        console.error("Erreur lors du parsing des images:", e);
        return [];
      }
    }
    
    // Si c'est déjà un tableau (cast depuis any)
    const images = landingArtist.artworkImages as any[];
    return images.map(item => {
      if (typeof item === 'string') {
        return { name: '', url: item };
      } else if (typeof item === 'object' && item.url) {
        return item;
      }
      return { name: '', url: '' };
    });
  })
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageName, setNewImageName] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      intro: landingArtist.intro || '',
      artworkStyle: landingArtist.artworkStyle || '',
      artistsPage: landingArtist.artistsPage || false,
      imageUrl: landingArtist.imageUrl,
      websiteUrl: landingArtist.websiteUrl || '',
      facebookUrl: landingArtist.facebookUrl || '',
      instagramUrl: landingArtist.instagramUrl || '',
      twitterUrl: landingArtist.twitterUrl || '',
      linkedinUrl: landingArtist.linkedinUrl || '',
    }
  })

  const imageUrl = watch('imageUrl')
  const artistsPage = watch('artistsPage')
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Transformer undefined en null pour intro et artworkStyle
      const formattedData = {
        ...data,
        intro: data.intro || null,
        artworkStyle: data.artworkStyle || null,
        websiteUrl: data.websiteUrl || null,
        facebookUrl: data.facebookUrl || null,
        instagramUrl: data.instagramUrl || null,
        twitterUrl: data.twitterUrl || null,
        linkedinUrl: data.linkedinUrl || null,
      }
      
      // Préparer les données d'artworkImages pour le format attendu par l'API
      const landingArtistDataWithImages = {
        ...formattedData,
        artworkImages: JSON.stringify(artworkImages)
      }
      
      // Appel à la server action pour mettre à jour l'artiste
      const result = await updateLandingArtistAction(landingArtist.id, landingArtistDataWithImages)
      
      if (result.success) {
        toast.success('Artiste mis à jour avec succès')
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/landing/landingArtists')
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
          <h1 className="page-title">Modifier l'artiste de la landing page</h1>
        </div>
        <p className="page-subtitle">
          Modifier les informations de {landingArtist.artist.name} {landingArtist.artist.surname} pour la page d'accueil
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
                      alt={`${landingArtist.artist.name} ${landingArtist.artist.surname}`}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '200px', height: '200px', borderRadius: '8px', backgroundColor: '#e0e0e0', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '1.5rem' }}>
                    {landingArtist.artist.name.charAt(0)}{landingArtist.artist.surname.charAt(0)}
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
                
                <div className="form-group">
                  <label htmlFor="intro" className="form-label">Introduction</label>
                  <textarea
                    id="intro"
                    {...register('intro')}
                    className={`form-textarea ${errors.intro ? 'input-error' : ''}`}
                    rows={3}
                    placeholder="Courte introduction de l'artiste qui sera affichée sur la page d'accueil"
                  />
                  {errors.intro && (
                    <p className="form-error">{errors.intro.message}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="artworkStyle" className="form-label">Style artistique</label>
                  <input
                    id="artworkStyle"
                    type="text"
                    {...register('artworkStyle')}
                    className={`form-input ${errors.artworkStyle ? 'input-error' : ''}`}
                    placeholder="Style artistique (ex: Peinture contemporaine, Photographie, etc.)"
                  />
                  {errors.artworkStyle && (
                    <p className="form-error">{errors.artworkStyle.message}</p>
                  )}
                </div>
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
                            <Image
                              src={image.url}
                              alt={image.name || `Image ${index + 1}`}
                              fill
                              style={{ objectFit: 'cover' }}
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
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
          </div>
        </div>
      </form>
    </div>
  )
} 