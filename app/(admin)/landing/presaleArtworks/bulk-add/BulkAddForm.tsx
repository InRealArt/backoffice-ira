'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/app/components/Toast/ToastContext'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import BulkArtworkTable from './BulkArtworkTable'
import { createBulkPresaleArtworks } from '@/lib/actions/presale-artwork-actions'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import ProgressModal from '@/app/(protected)/art/create-artist-profile/ProgressModal'
import { ensureFolderExists, uploadImageToLandingFolder } from '@/lib/firebase/storage'
import { normalizeString } from '@/lib/utils'

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
  imageFile: z.instanceof(File).optional(),
  imageUrl: z.string().optional()
}).refine((data) => data.imageFile || data.imageUrl, {
  message: "Une image est requise (fichier ou URL)",
  path: ["imageFile"]
})

export type ArtworkData = {
  name: string
  description: string
  height: string
  width: string
  price: string
  imageFile?: File | null
  imageUrl?: string
}

interface Artist {
  id: number
  name: string
  surname: string
}

interface BulkAddFormProps {
  artists: Artist[]
  /**
   * ID de l'artiste à pré-sélectionner (pour les artistes connectés)
   * Si fourni, le champ artiste sera en lecture seule
   */
  defaultArtistId?: number
  /**
   * URL de redirection après annulation (par défaut: /landing/presaleArtworks)
   */
  cancelRedirectUrl?: string
  /**
   * URL de redirection après succès (par défaut: /landing/presaleArtworks)
   */
  successRedirectUrl?: string
}

export default function BulkAddForm({ 
  artists, 
  defaultArtistId,
  cancelRedirectUrl = '/landing/presaleArtworks',
  successRedirectUrl = '/landing/presaleArtworks'
}: BulkAddFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [numberOfArtworks, setNumberOfArtworks] = useState(0)
  const [artworksData, setArtworksData] = useState<ArtworkData[]>([])
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [currentArtworkIndex, setCurrentArtworkIndex] = useState<number | null>(null)
  const [progressSteps, setProgressSteps] = useState<
    Array<{
      id: string
      label: string
      status: 'pending' | 'in-progress' | 'completed' | 'error'
    }>
  >([])
  const [progressError, setProgressError] = useState<string | undefined>(undefined)
  const { success, error } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<BulkAddFormValues>({
    resolver: zodResolver(bulkAddSchema),
    defaultValues: {
      artistId: defaultArtistId ? defaultArtistId.toString() : '',
      numberOfArtworks: ''
    }
  })

  // Pré-sélectionner l'artiste si defaultArtistId est fourni
  useEffect(() => {
    if (defaultArtistId) {
      setValue('artistId', defaultArtistId.toString())
      const artist = artists.find(a => a.id === defaultArtistId)
      if (artist) {
        setSelectedArtist(artist)
      }
    }
  }, [defaultArtistId, artists, setValue])

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
      imageFile: null,
      imageUrl: ''
    }))
    
    setArtworksData(initialArtworks)
    setShowTable(true)
  }

  const handleCancel = () => {
    router.push(cancelRedirectUrl)
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
    
    // Valider toutes les œuvres
    const validationResults = artworksData.map((artwork, index) => {
      const errors: string[] = []
      
      if (!artwork.name.trim()) {
        errors.push('Le nom est requis')
      }
      
      if (!artwork.imageFile && !artwork.imageUrl) {
        errors.push('Une image est requise')
      }
      
      if (artwork.price && artwork.price.trim()) {
        const price = parseFloat(artwork.price.replace(',', '.'))
        if (isNaN(price) || price < 0) {
          errors.push('Le prix doit être un nombre positif')
        }
      }
      
      if (artwork.width && artwork.width.trim()) {
        const width = parseInt(artwork.width)
        if (isNaN(width) || width <= 0) {
          errors.push('La largeur doit être un nombre positif')
        }
      }
      
      if (artwork.height && artwork.height.trim()) {
        const height = parseInt(artwork.height)
        if (isNaN(height) || height <= 0) {
          errors.push('La hauteur doit être un nombre positif')
        }
      }
      
      return {
        valid: errors.length === 0,
        index,
        errors
      }
    })

    const invalidArtworks = validationResults.filter(result => !result.valid)
    
    if (invalidArtworks.length > 0) {
      error(`Veuillez corriger les erreurs dans les œuvres ${invalidArtworks.map(a => a.index + 1).join(', ')}`)
      setIsSubmitting(false)
      return
    }

    if (!selectedArtist) {
      error('Aucun artiste sélectionné')
      setIsSubmitting(false)
      return
    }

    try {

      // Préparer le nom du répertoire Firebase
      const folderName = `${selectedArtist.name} ${selectedArtist.surname}`
      const folderPath = `artists/${folderName}/landing`

      // Vérifier/créer le répertoire Firebase
      setShowProgressModal(true)
      setProgressSteps([
        { id: 'folder-check', label: 'Vérification du répertoire Firebase', status: 'in-progress' },
        { id: 'upload', label: 'Upload des images', status: 'pending' },
        { id: 'creation', label: 'Création des œuvres', status: 'pending' },
        { id: 'translation', label: 'Traduction des descriptions', status: 'pending' }
      ])
      setProgressError(undefined)

      const folderExists = await ensureFolderExists(
        folderPath,
        selectedArtist.name,
        selectedArtist.surname
      )

      if (!folderExists) {
        setProgressSteps(prev => prev.map(s => 
          s.id === 'folder-check' ? { ...s, status: 'error' } : s
        ))
        setProgressError('Impossible de créer le répertoire Firebase')
        error('Impossible de créer le répertoire Firebase')
        setIsSubmitting(false)
        return
      }

      setProgressSteps(prev => prev.map(s => 
        s.id === 'folder-check' ? { ...s, status: 'completed' } : s
      ))

      // Uploader les images et préparer les données
      const artworksToCreate: Array<{
        name: string
        description?: string
        price: number | null
        imageUrl: string
        width: number | null
        height: number | null
      }> = []

      setProgressSteps(prev => prev.map(s => 
        s.id === 'upload' ? { ...s, status: 'in-progress' } : s
      ))

      for (let i = 0; i < artworksData.length; i++) {
        const artwork = artworksData[i]
        setCurrentArtworkIndex(i)

        let imageUrl = artwork.imageUrl || ''

        // Si un fichier est fourni, l'uploader
        if (artwork.imageFile) {
          try {
            // Générer un nom de fichier unique basé sur le nom de l'œuvre
            const fileName = normalizeString(artwork.name || `artwork-${Date.now()}-${i}`)
            
            imageUrl = await uploadImageToLandingFolder(
              artwork.imageFile,
              folderName,
              fileName,
              (status, error) => {
                // Callback pour la conversion (non utilisé dans la modale actuelle)
              },
              (status, error) => {
                // Callback pour l'upload (non utilisé dans la modale actuelle)
              }
            )
          } catch (uploadError) {
            console.error(`Erreur lors de l'upload de l'image pour l'œuvre ${i + 1}:`, uploadError)
            setProgressSteps(prev => prev.map(s => 
              s.id === 'upload' ? { ...s, status: 'error' } : s
            ))
            setProgressError(`Erreur lors de l'upload de l'image pour l'œuvre ${i + 1}`)
            error(`Erreur lors de l'upload de l'image pour l'œuvre ${i + 1}`)
            setIsSubmitting(false)
            return
          }
        }

        if (!imageUrl) {
          setProgressSteps(prev => prev.map(s => 
            s.id === 'upload' ? { ...s, status: 'error' } : s
          ))
          setProgressError(`Aucune image pour l'œuvre ${i + 1}`)
          error(`Aucune image pour l'œuvre ${i + 1}`)
          setIsSubmitting(false)
          return
        }

        artworksToCreate.push({
          name: artwork.name,
          description: artwork.description || undefined,
          price: artwork.price && artwork.price.trim() !== '' 
            ? parseFloat(artwork.price.replace(',', '.')) 
            : null,
          imageUrl,
          width: artwork.width && artwork.width.trim() !== '' 
            ? parseInt(artwork.width) 
            : null,
          height: artwork.height && artwork.height.trim() !== '' 
            ? parseInt(artwork.height) 
            : null
        })
      }

      setCurrentArtworkIndex(null)
      setProgressSteps(prev => prev.map(s => 
        s.id === 'upload' ? { ...s, status: 'completed' } : s
      ))

      // Créer les œuvres en masse
      setProgressSteps(prev => prev.map(s => 
        s.id === 'creation' ? { ...s, status: 'in-progress' } : s
      ))

      const result = await createBulkPresaleArtworks({
        artistId: selectedArtist.id,
        artworks: artworksToCreate
      })

      if (!result.success) {
        setProgressSteps(prev => prev.map(s => 
          s.id === 'creation' ? { ...s, status: 'error' } : s
        ))
        setProgressError(result.message || 'Erreur lors de la création des œuvres')
        error(result.message || 'Erreur lors de la création des œuvres')
        setIsSubmitting(false)
        return
      }

      setProgressSteps(prev => prev.map(s => 
        s.id === 'creation' ? { ...s, status: 'completed' } : s
      ))

      // Gérer les traductions pour chaque œuvre créée
      setProgressSteps(prev => prev.map(s => 
        s.id === 'translation' ? { ...s, status: 'in-progress' } : s
      ))

      try {
        for (let i = 0; i < result.artworks!.length; i++) {
          const createdArtwork = result.artworks![i]
          const originalData = artworksData[i]
          
          await handleEntityTranslations('PresaleArtwork', createdArtwork.id, {
            name: originalData.name,
            description: originalData.description || null
          })
        }

        setProgressSteps(prev => prev.map(s => 
          s.id === 'translation' ? { ...s, status: 'completed' } : s
        ))
      } catch (translationError) {
        console.error('Erreur lors de la gestion des traductions:', translationError)
        setProgressSteps(prev => prev.map(s => 
          s.id === 'translation' ? { ...s, status: 'error' } : s
        ))
        // On ne bloque pas la création en cas d'erreur de traduction
      }

      success(`${result.count!} œuvre${result.count! > 1 ? 's' : ''} créée${result.count! > 1 ? 's' : ''} avec succès`)
      
      // Fermer la modale après un court délai
      setTimeout(() => {
        setShowProgressModal(false)
        router.push(successRedirectUrl)
      }, 1000)
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement:', err)
        setProgressError('Une erreur est survenue lors de l\'enregistrement')
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

        <ProgressModal
          isOpen={showProgressModal}
          steps={progressSteps}
          currentError={progressError}
          title="Création des œuvres"
          onClose={() => {
            if (progressError) {
              setShowProgressModal(false)
              setProgressError(undefined)
            }
          }}
        />

        {currentArtworkIndex !== null && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg">
            Upload de l'œuvre {currentArtworkIndex + 1} / {artworksData.length}...
          </div>
        )}

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
                disabled={isSubmitting || !!defaultArtistId}
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
              <p className="text-xs text-text-secondary mt-1">
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
