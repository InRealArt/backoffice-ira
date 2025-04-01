'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
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
    )
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
      imageUrl: ''
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
            setImagePreview(presaleArtwork.imageUrl)
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
      
      if (mode === 'create') {
        const result = await createPresaleArtwork({
          name: data.name,
          artistId: parseInt(data.artistId),
          price: formattedPrice,
          imageUrl: data.imageUrl
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
          imageUrl: data.imageUrl
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