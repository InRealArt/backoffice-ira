'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { artworkSchema, ArtworkFormData } from './schema'
import { createArtwork } from '@/app/actions/shopify/createArtwork'
import toast from 'react-hot-toast'
import './ArtworkCreationForm.css'

export default function ArtworkCreationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ArtworkFormData>({
    resolver: zodResolver(artworkSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      artist: '',
      medium: '',
      dimensions: '',
      year: new Date().getFullYear().toString(),
      edition: '',
      tags: '',
      images: undefined
    }
  })
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    // Prévisualisation des images
    const imageFiles = Array.from(files)
    const imageUrls: string[] = []
    
    imageFiles.forEach(file => {
      const url = URL.createObjectURL(file)
      imageUrls.push(url)
    })
    
    setPreviewImages(imageUrls)
  }
  
  const onSubmit = async (data: ArtworkFormData) => {
    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      
      // Ajouter les champs textuels
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'images' && value) {
          formData.append(key, value.toString())
        }
      })
      
      // Ajouter les images
      if (data.images && data.images.length > 0) {
        Array.from(data.images).forEach((file, index) => {
          formData.append(`image-${index}`, file)
        })
      }
      
      // Envoyer au serveur
      const result = await createArtwork(formData)
      
      if (result.success) {
        toast.success(`L'œuvre "${data.title}" a été créée avec succès!`)
        reset()
        setPreviewImages([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        toast.error(`Erreur: ${result.message}`)
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'œuvre:', error)
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="form-container">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-grid">
          {/* Titre */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Titre de l'œuvre*
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={`form-input ${errors.title ? 'form-input-error' : ''}`}
              placeholder="Sans titre #12"
            />
            {errors.title && (
              <p className="form-error">{errors.title.message}</p>
            )}
          </div>
          
          {/* Prix */}
          <div className="form-group">
            <label htmlFor="price" className="form-label">
              Prix (€)*
            </label>
            <input
              id="price"
              type="text"
              {...register('price')}
              className={`form-input ${errors.price ? 'form-input-error' : ''}`}
              placeholder="1500"
            />
            {errors.price && (
              <p className="form-error">{errors.price.message}</p>
            )}
          </div>
        </div>
        
        {/* Description */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description*
          </label>
          <textarea
            id="description"
            {...register('description')}
            className={`form-textarea ${errors.description ? 'form-input-error' : ''}`}
            rows={4}
            placeholder="Description détaillée de l'œuvre..."
          />
          {errors.description && (
            <p className="form-error">{errors.description.message}</p>
          )}
        </div>
        
        <div className="form-grid">
          {/* Artiste */}
          <div className="form-group">
            <label htmlFor="artist" className="form-label">
              Artiste*
            </label>
            <input
              id="artist"
              type="text"
              {...register('artist')}
              className={`form-input ${errors.artist ? 'form-input-error' : ''}`}
              placeholder="Nom de l'artiste"
            />
            {errors.artist && (
              <p className="form-error">{errors.artist.message}</p>
            )}
          </div>
          
          {/* Support/Medium */}
          <div className="form-group">
            <label htmlFor="medium" className="form-label">
              Support/Medium*
            </label>
            <input
              id="medium"
              type="text"
              {...register('medium')}
              className={`form-input ${errors.medium ? 'form-input-error' : ''}`}
              placeholder="Acrylique sur toile"
            />
            {errors.medium && (
              <p className="form-error">{errors.medium.message}</p>
            )}
          </div>
        </div>
        
        <div className="form-grid">
          {/* Dimensions */}
          <div className="form-group">
            <label htmlFor="dimensions" className="form-label">
              Dimensions (cm)*
            </label>
            <input
              id="dimensions"
              type="text"
              {...register('dimensions')}
              className={`form-input ${errors.dimensions ? 'form-input-error' : ''}`}
              placeholder="100 x 80 x 2"
            />
            {errors.dimensions && (
              <p className="form-error">{errors.dimensions.message}</p>
            )}
          </div>
          
          {/* Année */}
          <div className="form-group">
            <label htmlFor="year" className="form-label">
              Année de création
            </label>
            <input
              id="year"
              type="text"
              {...register('year')}
              className={`form-input ${errors.year ? 'form-input-error' : ''}`}
              placeholder="2023"
            />
            {errors.year && (
              <p className="form-error">{errors.year.message}</p>
            )}
          </div>
        </div>
        
        <div className="form-grid">
          {/* Édition */}
          <div className="form-group">
            <label htmlFor="edition" className="form-label">
              Édition/Série
            </label>
            <input
              id="edition"
              type="text"
              {...register('edition')}
              className={`form-input ${errors.edition ? 'form-input-error' : ''}`}
              placeholder="Édition limitée 2/10"
            />
            {errors.edition && (
              <p className="form-error">{errors.edition.message}</p>
            )}
          </div>
          
          {/* Tags */}
          <div className="form-group">
            <label htmlFor="tags" className="form-label">
              Tags (séparés par des virgules)
            </label>
            <input
              id="tags"
              type="text"
              {...register('tags')}
              className={`form-input ${errors.tags ? 'form-input-error' : ''}`}
              placeholder="abstrait, contemporain, acrylique"
            />
            {errors.tags && (
              <p className="form-error">{errors.tags.message}</p>
            )}
          </div>
        </div>
        
        {/* Images */}
        <div className="form-group">
          <label htmlFor="images" className="form-label">
            Images*
          </label>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            {...register('images')}
            onChange={handleImageChange}
            className={`form-file-input ${errors.images ? 'form-input-error' : ''}`}
          />
          {errors.images && (
            <p className="form-error">{errors.images.message}</p>
          )}
        </div>
        
        {/* Prévisualisation des images */}
        {previewImages.length > 0 && (
          <div className="image-preview-container">
            {previewImages.map((src, index) => (
              <div key={index} className="image-preview">
                <img src={src} alt={`Aperçu ${index + 1}`} />
              </div>
            ))}
          </div>
        )}
        
        <div className="form-actions">
          <button
            type="button"
            onClick={() => {
              reset()
              setPreviewImages([])
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            className="button button-secondary"
            disabled={isSubmitting}
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="button button-primary"
          >
            {isSubmitting ? 'Création en cours...' : 'Créer l\'œuvre'}
          </button>
        </div>
      </form>
    </div>
  )
}