'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/app/components/Toast/ToastContext' 
import Image from 'next/image'
import { X, Plus, AlertCircle } from 'lucide-react'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { 
  createPresaleArtwork, 
  updatePresaleArtwork, 
  getPresaleArtworkById,
  getMaxPresaleArtworkOrder,
  getPresaleArtworkByOrder
} from '@/lib/actions/presale-artwork-actions'
import { getAllArtistsAndGalleries } from '@/lib/actions/prisma-actions'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import TranslationField from '@/app/components/TranslationField'

// Schéma de validation
const presaleArtworkSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  artistId: z.string().min(1, "Veuillez sélectionner un artiste"),
  imageUrl: z.string().min(1, "L'URL de l'image est requise").url("L'URL doit être valide"),
  description: z.string().optional(),
  price: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
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
  const [nextOrder, setNextOrder] = useState<number>(0)
  const [orderExists, setOrderExists] = useState<boolean>(true)
  const [orderValue, setOrderValue] = useState<string>('0')
  const [isCheckingOrder, setIsCheckingOrder] = useState<boolean>(false)
  const { success, error } = useToast()
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
      description: '',
      width: '',
      height: '',
      order: '0'
    }
  })
  
  // Récupérer les artistes
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const artistsData = await getAllArtistsAndGalleries()
        setArtists(artistsData)
      } catch (error: any) {
        console.error('Erreur lors de la récupération des artistes:', error)
        error('Erreur lors de la récupération des artistes')
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
            setValue('price', presaleArtwork.price?.toString() || '')
            setValue('imageUrl', presaleArtwork.imageUrl)
            setValue('description', presaleArtwork.description || '')
            setValue('width', presaleArtwork.width?.toString() || '')
            setValue('height', presaleArtwork.height?.toString() || '')
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
            error("Œuvre en prévente non trouvée")
            router.push('/landing/presaleArtworks')
          }
        } catch (error: any) {
          console.error('Erreur lors de la récupération de l\'œuvre en prévente:', error)
          error('Erreur lors de la récupération de l\'œuvre en prévente')
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }
    
    fetchPresaleArtwork()
  }, [mode, presaleArtworkId, setValue, router])
  
  // Charger l'ordre maximum pour le mode création
  useEffect(() => {
    const loadMaxOrder = async () => {
      if (mode === 'create') {
        try {
          const maxOrder = await getMaxPresaleArtworkOrder()
          const newOrder = maxOrder + 1
          setNextOrder(newOrder)
          setValue('order', newOrder.toString())
        } catch (error) {
          console.error('Erreur lors de la récupération de l\'ordre maximum:', error)
        }
      }
    }
    
    loadMaxOrder()
  }, [mode, setValue])
  
  const onSubmit = async (data: PresaleArtworkFormValues) => {
    setIsSubmitting(true)
    
    try {
      const formattedPrice = data.price && data.price.trim() !== '' ? parseFloat(data.price.replace(',', '.')) : null
      const formattedWidth = data.width && data.width.trim() !== '' ? parseInt(data.width) : null
      const formattedHeight = data.height && data.height.trim() !== '' ? parseInt(data.height) : null
      const formattedOrder = data.order && data.order.trim() !== '' ? parseInt(data.order) : undefined
      
      if (mode === 'create') {
        const result = await createPresaleArtwork({
          name: data.name,
          artistId: parseInt(data.artistId),
          price: formattedPrice,
          imageUrl: data.imageUrl,
          description: data.description,
          width: formattedWidth,
          height: formattedHeight,
          order: formattedOrder,
          mockupUrls: JSON.stringify(mockupUrls)
        })
        
        if (result.success) {
          success('Œuvre en prévente créée avec succès')
          
          // Gestion des traductions pour name et description
          try {
            if (result.presaleArtwork?.id) {
              await handleEntityTranslations('PresaleArtwork', result.presaleArtwork.id, {
                name: data.name,
                description: data.description || null
              })
            }
          } catch (translationError) {
            console.error('Erreur lors de la gestion des traductions:', translationError)
            // On ne bloque pas la création en cas d'erreur de traduction
          }
          
          router.push('/landing/presaleArtworks')
        } else {
          error(result.message || 'Erreur lors de la création de l\'œuvre en prévente')
        }
      } else if (mode === 'edit' && presaleArtworkId) {
        const result = await updatePresaleArtwork(presaleArtworkId, {
          name: data.name,
          artistId: parseInt(data.artistId),
          price: formattedPrice,
          imageUrl: data.imageUrl,
          description: data.description,
          width: formattedWidth,
          height: formattedHeight,
          order: formattedOrder,
          mockupUrls: JSON.stringify(mockupUrls)
        })
        
        if (result.success) {
          success('Œuvre en prévente mise à jour avec succès')
          
          // Gestion des traductions pour name et description
          try {
            await handleEntityTranslations('PresaleArtwork', presaleArtworkId, {
              name: data.name,
              description: data.description || null
            })
          } catch (translationError) {
            console.error('Erreur lors de la gestion des traductions:', translationError)
            // On ne bloque pas la mise à jour en cas d'erreur de traduction
          }
          
          router.push('/landing/presaleArtworks')
        } else {
          error(result.message || 'Erreur lors de la mise à jour de l\'œuvre en prévente')
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error)
      error('Une erreur est survenue')
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
  
  // Vérifier si l'ordre existe lorsqu'il est modifié en mode édition
  const handleOrderChange = async (value: string) => {
    if (mode === 'edit' && presaleArtworkId) {
      setOrderValue(value)
      
      if (value && !isNaN(parseInt(value))) {
        setIsCheckingOrder(true)
        const targetOrder = parseInt(value)
        
        try {
          const artwork = await getPresaleArtworkByOrder(targetOrder)
          // L'ordre existe si on trouve une œuvre différente avec cet ordre
          setOrderExists(artwork !== null && artwork.id !== presaleArtworkId)
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'ordre:', error)
          setOrderExists(false)
        } finally {
          setIsCheckingOrder(false)
        }
      } else {
        setOrderExists(false)
      }
    }
  }
  
  if (isLoading) {
    return <LoadingSpinner message="Chargement des données..." />
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-container">
      <div className="form-card">
        <div className="card-content">
          <TranslationField
            entityType="PresaleArtwork"
            entityId={mode === 'edit' ? presaleArtworkId || null : null}
            field="name"
            label={<>Nom de l'œuvre <span className="text-danger">*</span></>}
            errorMessage={errors.name?.message}
          >
            <input
              id="name"
              type="text"
              {...register('name')}
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              placeholder="Ex: La Joconde, Les Tournesols..."
              disabled={isSubmitting}
            />
          </TranslationField>
          
          <TranslationField
            entityType="PresaleArtwork"
            entityId={mode === 'edit' ? presaleArtworkId || null : null}
            field="description"
            label="Description"
            errorMessage={errors.description?.message}
          >
            <textarea
              id="description"
              {...register('description')}
              className={`form-input ${errors.description ? 'input-error' : ''}`}
              placeholder="Description de l'œuvre..."
              rows={3}
              disabled={isSubmitting}
            />
          </TranslationField>
          
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
            {mode === 'create' ? (
              // En mode création, l'ordre est en lecture seule
              <input
                id="order"
                type="number"
                value={nextOrder}
                className="form-input bg-gray-100"
                disabled={true}
              />
            ) : (
              // En mode édition, l'ordre peut être modifié s'il existe
              <div>
                <div className="relative">
                  <input
                    id="order"
                    type="number"
                    min="0"
                    step="1"
                    {...register('order', {
                      onChange: (e) => handleOrderChange(e.target.value)
                    })}
                    className={`form-input ${!orderExists && orderValue ? 'input-warning' : ''} ${errors.order ? 'input-error' : ''}`}
                    placeholder="0"
                    disabled={isSubmitting || isCheckingOrder}
                  />
                  {isCheckingOrder && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <LoadingSpinner size="small" message="" inline />
                    </div>
                  )}
                </div>
                {!orderExists && orderValue && (
                  <div className="flex items-center mt-1 text-amber-600">
                    <AlertCircle size={14} className="mr-1" />
                    <p className="text-xs">
                      L'ordre {orderValue} n'existe pas. Seuls les échanges avec des ordres existants sont possibles.
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  La modification de l'ordre échangera la position avec une autre œuvre déjà existante.
                </p>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="price" className="form-label">Prix (€)</label>
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
            <label className="form-label">Dimensions (cm)</label>
            <div className="d-flex gap-sm">
              <div style={{ flex: 1 }}>
                <label htmlFor="width" className="form-label">Largeur</label>
                <input
                  id="width"
                  type="number"
                  min="0"
                  step="1"
                  {...register('width')}
                  className={`form-input ${errors.width ? 'input-error' : ''}`}
                  placeholder="Ex: 50"
                  disabled={isSubmitting}
                />
                {errors.width && (
                  <p className="form-error">{errors.width.message}</p>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="height" className="form-label">Hauteur</label>
                <input
                  id="height"
                  type="number"
                  min="0"
                  step="1"
                  {...register('height')}
                  className={`form-input ${errors.height ? 'input-error' : ''}`}
                  placeholder="Ex: 70"
                  disabled={isSubmitting}
                />
                {errors.height && (
                  <p className="form-error">{errors.height.message}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Dimensions en centimètres (optionnel)
            </p>
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