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
import { X, Plus } from 'lucide-react'

// Schéma de validation
const formSchema = z.object({
  name: z.string().min(1, 'Le prénom est requis'),
  surname: z.string().min(1, 'Le nom est requis'),
  pseudo: z.string().min(1, 'Le pseudo est requis'),
  intro: z.string().nullable().optional(),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  artworkStyle: z.string().nullable().optional(),
  artistsPage: z.boolean().default(false),
  publicKey: z.string().min(1, 'La clé publique est requise'),
  imageUrl: z.string().url('URL d\'image invalide'),
  isGallery: z.boolean().default(false),
  backgroundImage: z.string().url('URL d\'image d\'arrière-plan invalide').nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

// Extension du type Artist pour inclure artworkImages
interface ArtistWithArtworkImages extends Artist {
  artworkImages: {name: string, url: string}[]
}

interface ArtistEditFormProps {
  artist: Artist & { artworkImages?: string[] | {name: string, url: string}[] }
}

export default function ArtistEditForm({ artist }: ArtistEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [artworkImages, setArtworkImages] = useState<{name: string, url: string}[]>(() => {
    // Parse le champ artworkImages qui peut être une chaîne JSON ou un tableau
    if (!artist.artworkImages) {
      return [];
    }
    
    if (typeof artist.artworkImages === 'string') {
      try {
        const parsed = JSON.parse(artist.artworkImages);
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
    const images = artist.artworkImages as any[];
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
      name: artist.name,
      surname: artist.surname,
      pseudo: artist.pseudo,
      intro: artist.intro || '',
      description: artist.description,
      artworkStyle: artist.artworkStyle || '',
      artistsPage: artist.artistsPage || false,
      publicKey: artist.publicKey,
      imageUrl: artist.imageUrl,
      isGallery: artist.isGallery || false,
      backgroundImage: artist.backgroundImage || null,
    }
  })

  const isGallery = watch('isGallery')
  const imageUrl = watch('imageUrl')
  const artistsPage = watch('artistsPage')
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Transformer undefined en null pour backgroundImage et intro
      const formattedData = {
        ...data,
        intro: data.intro || null,
        artworkStyle: data.artworkStyle || null,
        backgroundImage: data.backgroundImage || null,
        // Ne pas inclure artworkImages ici car ce n'est pas un champ standard du modèle Artist
      }
      
      // Préparer les données d'artworkImages pour le format attendu par l'API
      // On converti notre tableau d'objets en chaîne JSON pour le stockage en BDD
      const artistDataWithImages = {
        ...formattedData,
        artworkImages: JSON.stringify(artworkImages)
      }
      
      const result = await updateArtist(artist.id, artistDataWithImages)
      
      if (result.success) {
        toast.success('Artiste mis à jour avec succès')
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/dataAdministration/artists')
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

                  <div className="form-group">
                    <div className="d-flex align-items-center gap-md" style={{ marginBottom: '20px' }}>
                      <span className={!artistsPage ? 'text-primary' : 'text-muted'} style={{ fontWeight: !artistsPage ? 'bold' : 'normal' }}>Affiche Page artiste Landing désactivée</span>
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
                      <span className={artistsPage ? 'text-primary' : 'text-muted'} style={{ fontWeight: artistsPage ? 'bold' : 'normal' }}>Affiche Page artiste Landing activée</span>
                    </div>
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
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-card">
          <div className="card-content">
            <div className="form-group">
              <label htmlFor="intro" className="form-label">Introduction</label>
              <textarea
                id="intro"
                {...register('intro')}
                className={`form-textarea ${errors.intro ? 'input-error' : ''}`}
                rows={2}
              />
              {errors.intro && (
                <p className="form-error">{errors.intro.message}</p>
              )}
            </div>

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
            
            {/* GESTION DES IMAGES DANS LE FORMULAIRE AVEC ISOLATION DES ÉVÉNEMENTS */}
            <div className="form-group">
              <label className="form-label">Images des œuvres affichées sur la page &quot;artists&quot; de la Landing</label>
              
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#fafafa',
                borderRadius: '6px',
                flexWrap: 'wrap'
              }}>
                <input
                  type="text"
                  value={newImageName}
                  onChange={(e) => setNewImageName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const urlInput = document.getElementById('newImageUrl') as HTMLInputElement;
                      if (urlInput) {
                        urlInput.focus();
                      }
                      return false;
                    }
                  }}
                  placeholder="Nom de l'image"
                  className="form-input"
                  style={{ flex: 1 }}
                />

                <input
                  id="newImageUrl"
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    // Empêcher toute propagation d'événement clavier
                    e.stopPropagation();
                    
                    if (e.key === 'Enter') {
                      // Empêcher explicitement la soumission du formulaire
                      e.preventDefault();
                      
                      if (newImageUrl && newImageUrl.trim() && newImageUrl.trim().toLowerCase().startsWith('http')) {
                        setArtworkImages([...artworkImages, {name: newImageName.trim(), url: newImageUrl.trim()}]);
                        setNewImageUrl('');
                        setNewImageName('');
                      }
                      
                      // Assurer qu'aucun autre gestionnaire ne sera appelé
                      return false;
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="form-input"
                  style={{ flex: 2 }}
                />
                
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    // Empêcher toute propagation d'événement vers le formulaire
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (newImageUrl && newImageUrl.trim() && newImageUrl.trim().toLowerCase().startsWith('http')) {
                      setArtworkImages([...artworkImages, {name: newImageName.trim(), url: newImageUrl.trim()}]);
                      setNewImageUrl('');
                      setNewImageName('');
                    }
                  }}
                  onKeyDown={(e) => {
                    // Empêcher toute propagation si cette div est activée par clavier
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (newImageUrl && newImageUrl.trim() && newImageUrl.trim().toLowerCase().startsWith('http')) {
                        setArtworkImages([...artworkImages, {name: newImageName.trim(), url: newImageUrl.trim()}]);
                        setNewImageUrl('');
                        setNewImageName('');
                      }
                    }
                    
                    return false;
                  }}
                  className="btn btn-primary btn-small"
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    pointerEvents: 'auto',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} /> Ajouter
                </div>
              </div>
              
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto',
                border: artworkImages.length ? '1px solid #eee' : 'none',
                borderRadius: '4px'
              }}>
                {artworkImages.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#666', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                    Aucune image ajoutée
                  </div>
                ) : (
                  <div>
                    {artworkImages.map((image, index) => (
                      <div 
                        key={index}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '12px', 
                          borderBottom: index < artworkImages.length - 1 ? '1px solid #eee' : 'none',
                          backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
                        }}
                      >
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          backgroundImage: `url(${image.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderRadius: '4px',
                          marginRight: '12px',
                          border: '1px solid #eee'
                        }} />
                        
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          flex: 1,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            fontWeight: 'bold',
                            fontSize: '14px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {image.name || '(Sans nom)'}
                          </div>
                          <div style={{ 
                            fontSize: '12px',
                            color: '#666',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {image.url}
                          </div>
                        </div>
                        
                        <div 
                          onClick={(e) => {
                            // Empêcher la propagation ou la soumission du formulaire
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const newImages = [...artworkImages];
                            newImages.splice(index, 1);
                            setArtworkImages(newImages);
                          }}
                          className="btn btn-danger btn-small"
                          style={{ 
                            padding: '6px', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <X size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {artworkImages.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                  {artworkImages.length} {artworkImages.length === 1 ? 'image' : 'images'} dans la liste
                </div>
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