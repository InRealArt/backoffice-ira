'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/app/components/Toast/ToastContext'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import BulkArtworkTable from './BulkArtworkTable'
import { createBulkPresaleArtworks } from '@/lib/actions/presale-artwork-actions'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'

// Schéma de validation pour la sélection initiale
const bulkAddSchema = z.object({
  artistId: z.string().min(1, "Veuillez sélectionner un artiste"),
  numberOfArtworks: z.string().min(1, "Le nombre d'œuvres est requis")
    .refine((val) => {
      const num = parseInt(val)
      return !isNaN(num) && num > 0 && num <= 50
    }, "Le nombre doit être entre 1 et 50")
})

type BulkAddFormValues = z.infer<typeof bulkAddSchema>

// Schéma de validation pour chaque œuvre
export const artworkSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  height: z.string().optional(),
  width: z.string().optional(),
  price: z.string().optional(),
  imageUrl: z.string().min(1, "L'URL de l'image est requise").url("L'URL doit être valide")
})

export type ArtworkData = z.infer<typeof artworkSchema>

interface Artist {
  id: number
  name: string
  surname: string
}

interface BulkAddFormProps {
  artists: Artist[]
}

export default function BulkAddForm({ artists }: BulkAddFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [numberOfArtworks, setNumberOfArtworks] = useState(0)
  const [artworksData, setArtworksData] = useState<ArtworkData[]>([])
  const { success, error } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BulkAddFormValues>({
    resolver: zodResolver(bulkAddSchema)
  })

  const onSubmit = (data: BulkAddFormValues) => {
    const artist = artists.find(a => a.id.toString() === data.artistId)
    if (!artist) {
      error('Artiste non trouvé')
      return
    }

    const count = parseInt(data.numberOfArtworks)
    setSelectedArtist(artist)
    setNumberOfArtworks(count)
    
    // Initialiser les données des œuvres avec des valeurs vides
    const initialArtworks: ArtworkData[] = Array.from({ length: count }, () => ({
      name: '',
      description: '',
      height: '',
      width: '',
      price: '',
      imageUrl: ''
    }))
    
    setArtworksData(initialArtworks)
    setShowTable(true)
  }

  const handleCancel = () => {
    router.push('/landing/presaleArtworks')
  }

  const handleBackToForm = () => {
    setShowTable(false)
    setSelectedArtist(null)
    setNumberOfArtworks(0)
    setArtworksData([])
  }

  const handleArtworksDataChange = (newData: ArtworkData[]) => {
    setArtworksData(newData)
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    
    try {
      // Valider toutes les œuvres
      const validationResults = artworksData.map((artwork, index) => {
        try {
          artworkSchema.parse(artwork)
          return { valid: true, index }
        } catch (err) {
          return { 
            valid: false, 
            index, 
            errors: err instanceof z.ZodError ? err.errors : []
          }
        }
      })

      const invalidArtworks = validationResults.filter(result => !result.valid)
      
      if (invalidArtworks.length > 0) {
        error(`Veuillez corriger les erreurs dans les œuvres ${invalidArtworks.map(a => a.index + 1).join(', ')}`)
        return
      }

      if (!selectedArtist) {
        error('Aucun artiste sélectionné')
        return
      }

      // Préparer les données pour l'enregistrement
      const artworksToCreate = artworksData.map(artwork => ({
        name: artwork.name,
        description: artwork.description || undefined,
        price: artwork.price && artwork.price.trim() !== '' 
          ? parseFloat(artwork.price.replace(',', '.')) 
          : null,
        imageUrl: artwork.imageUrl,
        width: artwork.width && artwork.width.trim() !== '' 
          ? parseInt(artwork.width) 
          : null,
        height: artwork.height && artwork.height.trim() !== '' 
          ? parseInt(artwork.height) 
          : null
      }))

      // Créer les œuvres en masse
      const result = await createBulkPresaleArtworks({
        artistId: selectedArtist.id,
        artworks: artworksToCreate
      })

      if (result.success) {
        // Gérer les traductions pour chaque œuvre créée
        try {
          for (let i = 0; i < result.artworks!.length; i++) {
            const createdArtwork = result.artworks![i]
            const originalData = artworksData[i]
            
            await handleEntityTranslations('PresaleArtwork', createdArtwork.id, {
              name: originalData.name,
              description: originalData.description || null
            })
          }
        } catch (translationError) {
          console.error('Erreur lors de la gestion des traductions:', translationError)
          // On ne bloque pas la création en cas d'erreur de traduction
        }

        success(`${result.count!} œuvre${result.count! > 1 ? 's' : ''} créée${result.count! > 1 ? 's' : ''} avec succès`)
        router.push('/landing/presaleArtworks')
      } else {
        error(result.message || 'Erreur lors de la création des œuvres')
      }
      
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err)
      error('Une erreur est survenue lors de l\'enregistrement')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showTable && selectedArtist) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">
            Saisie des données pour {selectedArtist.name} {selectedArtist.surname}
          </h1>
          <p className="page-subtitle">
            {numberOfArtworks} œuvre{numberOfArtworks > 1 ? 's' : ''} à créer
          </p>
        </div>

        <BulkArtworkTable
          artworksData={artworksData}
          onDataChange={handleArtworksDataChange}
          isSubmitting={isSubmitting}
        />

        <div className="form-actions">
          <button
            type="button"
            onClick={handleBackToForm}
            className="btn btn-secondary btn-medium"
            disabled={isSubmitting}
          >
            Retour
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary btn-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="small" message="" inline />
                Enregistrement en cours...
              </>
            ) : (
              'Enregistrer'
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Ajout en masse d'œuvres en prévente</h1>
        <p className="page-subtitle">
          Ajoutez plusieurs œuvres en prévente en une seule fois pour un artiste sélectionné.
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            <h2 className="form-title">Sélection de l'artiste et du nombre d'œuvres</h2>
            
            <div className="form-group">
              <label htmlFor="artistId" className="form-label">
                Artiste <span className="text-danger">*</span>
              </label>
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
              <label htmlFor="numberOfArtworks" className="form-label">
                Nombre d'œuvres à créer <span className="text-danger">*</span>
              </label>
              <input
                id="numberOfArtworks"
                type="number"
                min="1"
                max="50"
                {...register('numberOfArtworks')}
                className={`form-input ${errors.numberOfArtworks ? 'input-error' : ''}`}
                placeholder="Ex: 5"
                disabled={isSubmitting}
              />
              {errors.numberOfArtworks && (
                <p className="form-error">{errors.numberOfArtworks.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Maximum 50 œuvres par lot
              </p>
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
            {isSubmitting ? (
              <>
                <LoadingSpinner size="small" message="" inline />
                Validation en cours...
              </>
            ) : (
              'Valider'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
