'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { X, Plus } from 'lucide-react'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { createPresaleArtwork, updatePresaleArtwork, getPresaleArtworkById } from '@/lib/actions/presale-artwork-actions'
import { getAllArtists } from '@/lib/actions/prisma-actions'

// Schéma de validation
const presaleArtworkSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  artistId: z.string().min(1, "Veuillez sélectionner un artiste"),
  imageUrl: z.string().min(1, "L'URL de l'image est requise").url("L'URL doit être valide"),
  price: z.string().min(1, "Le prix est requis")
    .refine(
      (val) => !isNaN(parseFloat(val.replace(',', '.'))),
      { message: "Le prix doit être un nombre valide" }
    )
    .refine(
      (val) => parseFloat(val.replace(',', '.')) > 0,
      { message: "Le prix doit être supérieur à 0" }
    ),
  order: z.string().default('')
})

type PresaleArtworkFormValues = z.infer<typeof presaleArtworkSchema>

interface PresaleArtworkFormProps {
  mode: 'create' | 'edit'
  presaleArtworkId?: number
}

interface Artist {
  id: number
  name: string
  surname: string
}

function ImageThumbnail({ url }: { url: string }) {
  return (
    <div className="inline-flex items-center">
      <div className="relative w-6 h-6 mr-1">
        <Image
          src={url}
          alt="Miniature"
          width={96}
          height={96}
          className="object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
      <span className="text-xs text-gray-500">✓</span>
    </div>
  )
}

export default function PresaleArtworkForm({ mode, presaleArtworkId }: PresaleArtworkFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [artists, setArtists] = useState<Artist[]>([])
  const [imagePreview, setImagePreview] = useState<string>('')
  const [mockupUrls, setMockupUrls] = useState<{name: string, url: string}[]>([])
  const [newMockupUrl, setNewMockupUrl] = useState('')
  const [newMockupName, setNewMockupName] = useState('')
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<PresaleArtworkFormValues>({
    resolver: zodResolver(presaleArtworkSchema),
    defaultValues: {
      name: '',
      artistId: '',
      price: '',
      imageUrl: '',
      order: '0'
    }
  })
  
  // Récupérer les artistes
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const artistsData = await getAllArtists()
        setArtists(artistsData)
      } catch (error) {
        console.error('Erreur lors de la récupération des artistes:', error)
        toast.error('Erreur lors de la récupération des artistes')
      }
    }
    
    fetchArtists()
  }, [])
  
  // Récupérer les données de l'œuvre en prévente si mode edit
  useEffect(() => {
    const fetchPresaleArtwork = async () => {
      if (mode === 'edit' && presaleArtworkId) {
        try {
          const presaleArtwork = await getPresaleArtworkById(presaleArtworkId)
          
          if (presaleArtwork) {
            setValue('name', presaleArtwork.name)
            setValue('artistId', presaleArtwork.artistId.toString())
            setValue('price', presaleArtwork.price.toString())
            setValue('imageUrl', presaleArtwork.imageUrl)
            setValue('order', presaleArtwork.order?.toString() || '0')
            setImagePreview(presaleArtwork.imageUrl)
            
            // Initialiser les URLs de mockups
            if (presaleArtwork.mockupUrls) {
              try {
                const parsedMockups = JSON.parse(presaleArtwork.mockupUrls as string)
                // Conversion d'anciens formats (simples URLs) vers le nouveau format {name, url}
                if (Array.isArray(parsedMockups)) {
                  setMockupUrls(parsedMockups.map(item => {
                    if (typeof item === 'string') {
                      return { name: '', url: item }
                    } else if (typeof item === 'object' && item.url) {
                      return item
                    }
                    return { name: '', url: '' }
                  }))
                } else {
                  setMockupUrls([])
                }
              } catch (error) {
                console.error('Erreur lors du parsing des mockups:', error)
                setMockupUrls([])
              }
            }
          } else {
            toast.error("Œuvre en prévente non trouvée")
            router.push('/landing/presaleArtworks')
          }
        } catch (error) {
          console.error('Erreur lors de la récupération de l\'œuvre en prévente:', error)
          toast.error('Erreur lors de la récupération de l\'œuvre en prévente')
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }
    
    fetchPresaleArtwork()
  }, [mode, presaleArtworkId, setValue, router])
  
  const onSubmit = async (data: PresaleArtworkFormValues) => {
    setIsSubmitting(true)
    
    try {
      const formattedPrice = parseFloat(data.price.replace(',', '.'))
      const formattedOrder = data.order && data.order.trim() !== '' ? parseInt(data.order) : undefined
      
      if (mode === 'create') {
        const result = await createPresaleArtwork({
          name: data.name,
          artistId: parseInt(data.artistId),
          price: formattedPrice,
          imageUrl: data.imageUrl,
          order: formattedOrder,
          mockupUrls: JSON.stringify(mockupUrls)
        })
        
        if (result.success) {
          toast.success('Œuvre en prévente créée avec succès')
          router.push('/landing/presaleArtworks')
        } else {
          toast.error(result.message || 'Erreur lors de la création de l\'œuvre en prévente')
        }
      } else if (mode === 'edit' && presaleArtworkId) {
        const result = await updatePresaleArtwork(presaleArtworkId, {
          name: data.name,
          artistId: parseInt(data.artistId),
          price: formattedPrice,
          imageUrl: data.imageUrl,
          order: formattedOrder,
          mockupUrls: JSON.stringify(mockupUrls)
        })
        
        if (result.success) {
          toast.success('Œuvre en prévente mise à jour avec succès')
          router.push('/landing/presaleArtworks')
        } else {
          toast.error(result.message || 'Erreur lors de la mise à jour de l\'œuvre en prévente')
        }
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/landing/presaleArtworks')
  }
  
  const handleAddMockup = () => {
    if (newMockupUrl.trim() === '') return
    
    // Ajouter le nouveau mockup à la liste
    setMockupUrls([...mockupUrls, { name: newMockupName, url: newMockupUrl }])
    
    // Réinitialiser les champs
    setNewMockupUrl('')
    setNewMockupName('')
  }
  
  const handleRemoveMockup = (index: number) => {
    const updatedMockups = [...mockupUrls]
    updatedMockups.splice(index, 1)
    setMockupUrls(updatedMockups)
  }
  
  if (isLoading) {
    return <LoadingSpinner message="Chargement des données..." />
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-container">
      <div className="form-card">
        <div className="card-content">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Nom de l'œuvre <span className="text-danger">*</span></label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              placeholder="Ex: La Joconde, Les Tournesols..."
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="form-error">{errors.name.message}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="artistId" className="form-label">Artiste <span className="text-danger">*</span></label>
            <select
              id="artistId"
              {...register('artistId')}
              className={`form-select ${errors.artistId ? 'input-error' : ''}`}
              disabled={isSubmitting}
            >
              <option value="">Sélectionnez un artiste</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id.toString()}>
                  {artist.name} {artist.surname}
                </option>
              ))}
            </select>
            {errors.artistId && (
              <p className="form-error">{errors.artistId.message}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="order" className="form-label">Ordre d'affichage</label>
            <input
              id="order"
              type="number"
              min="0"
              step="1"
              {...register('order')}
              className={`form-input ${errors.order ? 'input-error' : ''}`}
              placeholder="0"
              disabled={isSubmitting}
            />
            {errors.order && (
              <p className="form-error">{errors.order.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Plus le nombre est petit, plus l'œuvre apparaîtra en haut de la liste. 0 = affichage par défaut.
            </p>
          </div>
          
          <div className="form-group">
            <label htmlFor="price" className="form-label">Prix (€) <span className="text-danger">*</span></label>
            <input
              id="price"
              type="text"
              {...register('price')}
              className={`form-input ${errors.price ? 'input-error' : ''}`}
              placeholder="Ex: 1500"
              disabled={isSubmitting}
            />
            {errors.price && (
              <p className="form-error">{errors.price.message}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl" className="form-label">URL de l'image <span className="text-danger">*</span></label>
            <input
              id="imageUrl"
              type="url"
              {...register('imageUrl', {
                onChange: (e) => setImagePreview(e.target.value)
              })}
              className={`form-input ${errors.imageUrl ? 'input-error' : ''}`}
              placeholder="https://example.com/image.jpg"
              disabled={isSubmitting}
            />
            {errors.imageUrl && (
              <p className="form-error">{errors.imageUrl.message}</p>
            )}
            {imagePreview && (
              <div className="mt-1">
                <ImageThumbnail url={imagePreview} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">URLs des mockups</label>
            <div className="d-flex gap-sm">
              <div style={{ flex: 1 }}>
                <label htmlFor="newMockupName" className="form-label">Nom du mockup</label>
                <input
                  id="newMockupName"
                  type="text"
                  value={newMockupName}
                  onChange={(e) => setNewMockupName(e.target.value)}
                  className="form-input"
                  placeholder="Nom du mockup (optionnel)"
                  disabled={isSubmitting}
                />
              </div>
              <div style={{ flex: 3 }}>
                <label htmlFor="newMockupUrl" className="form-label">URL du mockup</label>
                <div className="d-flex gap-sm">
                  <input
                    id="newMockupUrl"
                    type="url"
                    value={newMockupUrl}
                    onChange={(e) => setNewMockupUrl(e.target.value)}
                    className="form-input"
                    placeholder="https://example.com/mockup.jpg"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={handleAddMockup}
                    disabled={!newMockupUrl || isSubmitting}
                    className="btn btn-primary btn-small"
                    aria-label="Ajouter un mockup"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mockup-list mt-3">
              {mockupUrls.length === 0 ? (
                <p className="text-xs text-gray-500">Aucun mockup ajouté</p>
              ) : (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {mockupUrls.map((mockup, index) => (
                    <div key={index} className="mockup-item" style={{ position: 'relative', width: '120px' }}>
                      <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '4px', overflow: 'hidden' }}>
                        <Image
                          src={mockup.url}
                          alt={mockup.name || `Mockup ${index + 1}`}
                          fill
                          style={{ objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMockup(index)}
                        className="btn btn-danger btn-small"
                        style={{ position: 'absolute', top: '4px', right: '4px', padding: '2px', borderRadius: '50%' }}
                        aria-label="Supprimer le mockup"
                        disabled={isSubmitting}
                      >
                        <X size={14} />
                      </button>
                      {mockup.name && (
                        <p className="text-xs text-gray-700 mt-1" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                          {mockup.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
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
          {isSubmitting ? 
            <>
              <LoadingSpinner size="small" message="" inline /> 
              {mode === 'create' ? 'Création en cours...' : 'Mise à jour en cours...'}
            </> : 
            (mode === 'create' ? 'Créer l\'œuvre' : 'Mettre à jour l\'œuvre')
          }
        </button>
      </div>
    </form>
  )
} 