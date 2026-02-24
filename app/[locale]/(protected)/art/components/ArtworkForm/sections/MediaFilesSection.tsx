'use client'

import { useState, useEffect } from 'react'
import { MediaFilesSectionProps } from '../types'
import FormSection from '../FormSection'
import FirebaseImageUpload from '../components/FirebaseImageUpload'
import FirebaseImageUploadByType from '../components/FirebaseImageUploadByType'
import { PhysicalItemImageType } from '@/src/generated/prisma/browser'
import { savePhysicalItemImage } from '@/lib/actions/prisma-actions'
import Tabs from '@/app/components/Tabs/Tabs'

// Mapping des types d'images vers leurs labels en français
const IMAGE_TYPE_LABELS: Record<PhysicalItemImageType, string> = {
  CLOSE_UP: 'Gros plan',
  SIGNATURE: 'Signature',
  SIDE_VIEW: 'Vue latérale',
  BACK_VIEW: 'Vue de derrière',
  IN_SITU: 'In situ',
  OTHER: 'Autres'
}

function MediaFilesSection({
  register,
  errors,
  setValue,
  control,
  getValues,
  isEditMode,
  initialImageUrl,
  fileInputRef,
  secondaryImagesInputRef,
  handleImageChange,
  handleSecondaryImagesChange,
  isFormReadOnly,
  artistName = '',
  artistSurname = '',
  artworkName = '',
  onMainImageUploaded,
  physicalItemId,
  initialImagesByType,
  pendingImagesByTypeRef,
  removedImagesByTypeRef
}: MediaFilesSectionProps) {
  const [imagesByType, setImagesByType] = useState<Record<string, string[]>>(
    initialImagesByType || {}
  )
  // Stocker les fichiers en attente d'upload par type
  const [pendingFilesByType, setPendingFilesByType] = useState<Record<string, File[]>>({})
  // Stocker les URLs d'images existantes supprimées par type
  const [removedImagesByType, setRemovedImagesByType] = useState<Record<string, string[]>>({})

  // Initialiser les images par type depuis les données initiales
  useEffect(() => {
    if (initialImagesByType) {
      setImagesByType(initialImagesByType)
    }
  }, [initialImagesByType])

  // Synchroniser les fichiers en attente avec la ref pour qu'ils soient accessibles lors de la soumission
  useEffect(() => {
    if (pendingImagesByTypeRef) {
      pendingImagesByTypeRef.current = pendingFilesByType
      console.log('📦 Fichiers en attente mis à jour dans la ref:', pendingFilesByType)
    }
  }, [pendingFilesByType, pendingImagesByTypeRef])

  // Synchroniser les images supprimées avec la ref
  useEffect(() => {
    if (removedImagesByTypeRef) {
      removedImagesByTypeRef.current = removedImagesByType
      console.log('🗑️ Images supprimées mises à jour dans la ref:', removedImagesByType)
    }
  }, [removedImagesByType, removedImagesByTypeRef])

  const handleImageUploaded = (imageUrl: string) => {
    // Mettre à jour le formulaire avec l'URL de l'image
    setValue('mainImageUrl', imageUrl, { shouldValidate: true })
    if (onMainImageUploaded) {
      onMainImageUploaded(imageUrl)
    }
  }

  const handleFilesChangedByType = (
    files: File[],
    imageType: PhysicalItemImageType
  ) => {
    console.log(`📁 Fichiers changés pour le type ${imageType}:`, files.length, 'fichier(s)')
    // Stocker les fichiers en attente d'upload pour ce type
    setPendingFilesByType((prev) => {
      const updated = {
        ...prev,
        [imageType]: files
      }
      console.log('📦 État mis à jour pour', imageType, ':', updated[imageType]?.length, 'fichier(s)')
      return updated
    })
  }

  const handleImageRemovedByType = (
    imageId: string,
    imageType: PhysicalItemImageType
  ) => {
    // Si c'est une image existante (commence par 'existing-')
    if (imageId.startsWith('existing-')) {
      const imageUrl = imageId.replace('existing-', '')
      
      // Retirer l'image de l'affichage
      setImagesByType((prev) => {
        const current = prev[imageType] || []
        return {
          ...prev,
          [imageType]: current.filter((url) => url !== imageUrl)
        }
      })
      
      // Ajouter l'URL à la liste des images à supprimer
      setRemovedImagesByType((prev) => {
        const current = prev[imageType] || []
        // Éviter les doublons
        if (!current.includes(imageUrl)) {
          return {
            ...prev,
            [imageType]: [...current, imageUrl]
          }
        }
        return prev
      })
      
      console.log(`🗑️ Image existante marquée pour suppression: ${imageUrl} (type: ${imageType})`)
    }
    // Pour les fichiers en attente, le composant enfant gère déjà la suppression
    // et notifie via onFilesChanged, donc on n'a rien à faire ici
  }

  // Obtenir tous les types d'images de l'enum
  const imageTypes = Object.values(PhysicalItemImageType) as PhysicalItemImageType[]

  return (
    <FormSection title="Visuel de l'œuvre" bgVariant="subtle-2">
      {/* Image Principale */}
      <div className="mb-8">
        <label htmlFor="mainImage" className="flex items-center gap-1" data-required={!isEditMode || !initialImageUrl}>
          Image Principale {isEditMode && initialImageUrl ? '(optionnelle)' : ''}
        </label>
        {isEditMode && initialImageUrl && (
          <p className="form-help">
            Une image existe déjà. Vous pouvez la remplacer en sélectionnant un nouveau fichier.
          </p>
        )}
        <FirebaseImageUpload
          onImageUploaded={handleImageUploaded}
          previewUrl={initialImageUrl}
          error={errors.mainImageUrl ? String(errors.mainImageUrl.message) : undefined}
          disabled={isFormReadOnly}
          artistName={artistName}
          artistSurname={artistSurname}
          artworkName={artworkName}
        />
        {errors.mainImageUrl && (!isEditMode || !initialImageUrl) && (
          <p className="form-error mt-2">{errors.mainImageUrl?.message ? String(errors.mainImageUrl.message) : 'L\'image principale est requise'}</p>
        )}
      </div>
      
      {/* Images par type avec onglets */}
      <div className="mt-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Images supplémentaires par type
          </h3>
        <p className="form-help">
            Ajoutez des images supplémentaires organisées par type pour enrichir la présentation de votre œuvre. Vous pouvez ajouter plusieurs images par type.
        </p>
        </div>

        <Tabs
          tabs={imageTypes.map((imageType) => {
            // S'assurer que chaque onglet reçoit uniquement les images de son type
            const imagesForThisType = imagesByType[imageType] || []
            
            return {
              id: imageType,
              label: IMAGE_TYPE_LABELS[imageType],
              content: (
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <FirebaseImageUploadByType
                    key={imageType} // Clé unique pour forcer le remontage si nécessaire
                    onFilesChanged={handleFilesChangedByType}
                    onImageRemoved={handleImageRemovedByType}
                    previewUrls={imagesForThisType}
                    pendingFiles={pendingFilesByType[imageType] || []}
                    disabled={isFormReadOnly}
                    artistName={artistName}
                    artistSurname={artistSurname}
                    artworkName={artworkName}
                    imageType={imageType}
                    imageTypeLabel={IMAGE_TYPE_LABELS[imageType]}
                  />
                </div>
              )
            }
          })}
          defaultTabId={imageTypes[0]}
        />
      </div>
    </FormSection>
  )
}

export default MediaFilesSection 