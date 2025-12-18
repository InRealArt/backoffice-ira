'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Camera, X } from 'lucide-react'
// Les imports pour l'upload seront utilisés lors de la soumission du formulaire
import { useToast } from '@/app/components/Toast/ToastContext'
import { PhysicalItemImageType } from '@prisma/client'

interface ImageItem {
  id: string // Identifiant unique
  type: 'existing' | 'pending' // existing = déjà uploadée, pending = en attente d'upload
  url: string // URL pour l'affichage (URL existante ou blob URL)
  file?: File // Fichier à uploader (seulement pour type 'pending')
}

interface FirebaseImageUploadByTypeProps {
  onFilesChanged: (files: File[], imageType: PhysicalItemImageType) => void
  onImageRemoved?: (imageId: string, imageType: PhysicalItemImageType) => void
  previewUrls?: string[] // Images déjà uploadées (URLs existantes)
  pendingFiles?: File[] // Fichiers en attente d'upload (passés depuis le parent)
  error?: string
  disabled?: boolean
  artistName: string
  artistSurname: string
  artworkName: string
  imageType: PhysicalItemImageType
  imageTypeLabel: string
}

export default function FirebaseImageUploadByType({
  onFilesChanged,
  onImageRemoved,
  previewUrls = [],
  pendingFiles: pendingFilesProp = [],
  error,
  disabled = false,
  artistName,
  artistSurname,
  artworkName,
  imageType,
  imageTypeLabel
}: FirebaseImageUploadByTypeProps) {
  // Séparer les images existantes (déjà uploadées) et les nouvelles (fichiers en attente)
  const [existingImages, setExistingImages] = useState<string[]>(previewUrls || [])
  const [pendingFiles, setPendingFiles] = useState<Map<string, File>>(new Map())
  const [blobUrls, setBlobUrls] = useState<Map<string, string>>(new Map()) // Stocker les blob URLs pour pouvoir les révoquer
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { error: errorToast } = useToast()

  // Synchroniser les images existantes quand elles changent
  useEffect(() => {
    setExistingImages(previewUrls || [])
  }, [previewUrls])

  // Fonction helper pour générer un ID stable basé sur les propriétés du fichier
  const getFileId = useCallback((file: File, index?: number) => {
    // Utiliser les propriétés du fichier pour créer un ID stable
    const baseId = `pending-${file.name}-${file.size}-${file.lastModified}`
    return index !== undefined ? `${baseId}-${index}` : baseId
  }, [])

  // Référence pour stocker les fichiers précédents et éviter les re-renders inutiles
  const prevPendingFilesRef = useRef<File[]>([])
  
  // Synchroniser les fichiers en attente depuis le parent
  useEffect(() => {
    // Créer une fonction pour comparer les fichiers (par nom, taille et dernière modification)
    const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`
    
    // Vérifier si les fichiers ont changé en comparant les clés
    const prevFileKeys = prevPendingFilesRef.current.map(getFileKey).sort().join('|')
    const newFileKeys = (pendingFilesProp || []).map(getFileKey).sort().join('|')
    
    // Si les fichiers sont identiques, ne rien faire
    if (prevFileKeys === newFileKeys) {
      return
    }
    
    // Mettre à jour la référence
    prevPendingFilesRef.current = pendingFilesProp || []
    
    if (pendingFilesProp && pendingFilesProp.length > 0) {
      // Créer une Map avec des IDs stables basés sur les propriétés du fichier
      const newFiles = new Map<string, File>()
      const newBlobUrls = new Map<string, string>()
      
      pendingFilesProp.forEach((file, index) => {
        // Utiliser un ID stable basé sur les propriétés du fichier
        const id = getFileId(file, index)
        newFiles.set(id, file)
        // Créer une nouvelle blob URL pour chaque fichier
        const blobUrl = URL.createObjectURL(file)
        newBlobUrls.set(id, blobUrl)
      })
      
      // Révoquer les anciennes blob URLs qui ne sont plus utilisées
      setBlobUrls((prevBlobUrls) => {
        prevBlobUrls.forEach((url, id) => {
          if (!newBlobUrls.has(id)) {
            URL.revokeObjectURL(url)
          }
        })
        return newBlobUrls
      })
      
      setPendingFiles(newFiles)
    } else {
      // Si plus de fichiers en attente, révoquer toutes les blob URLs
      setBlobUrls((prevBlobUrls) => {
        prevBlobUrls.forEach((url) => URL.revokeObjectURL(url))
        return new Map()
      })
      setPendingFiles(new Map())
    }
  }, [pendingFilesProp, getFileId]) // Inclure getFileId dans les dépendances

  // Créer les previews pour l'affichage
  const imageItems: ImageItem[] = [
    // Images existantes (déjà uploadées)
    ...existingImages.map((url) => ({
      id: `existing-${url}`,
      type: 'existing' as const,
      url
    })),
    // Fichiers en attente (avec blob URLs stockées)
    ...Array.from(pendingFiles.entries()).map(([id, file]) => ({
      id,
      type: 'pending' as const,
      url: blobUrls.get(id) || URL.createObjectURL(file), // Utiliser la blob URL stockée ou en créer une nouvelle
      file
    }))
  ]

  // Nettoyer les blob URLs quand le composant est démonté
  useEffect(() => {
    return () => {
      // Nettoyer toutes les blob URLs pour éviter les fuites mémoire
      blobUrls.forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, []) // Seulement au démontage du composant

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
      ]

      // Valider tous les fichiers
      const invalidFiles = acceptedFiles.filter(
        (file) => !validTypes.includes(file.type)
      )
      if (invalidFiles.length > 0) {
        const errorMsg = 'Format non supporté. Utilisez JPEG, PNG, GIF ou WebP'
        setUploadError(errorMsg)
        errorToast(errorMsg)
        return
      }

      const maxSize = 10 * 1024 * 1024 // 10MB
      const oversizedFiles = acceptedFiles.filter((file) => file.size > maxSize)
      if (oversizedFiles.length > 0) {
        const errorMsg = "Certaines images sont trop volumineuses (max 10MB)"
        setUploadError(errorMsg)
        errorToast(errorMsg)
        return
      }

      setUploadError(null)

      // Ajouter les fichiers à la liste des fichiers en attente
      // Utiliser les fichiers existants + les nouveaux
      const currentFilesArray = Array.from(pendingFiles.values())
      const allFiles = [...currentFilesArray, ...acceptedFiles]
      
      // Notifier le parent avec tous les fichiers (existants + nouveaux)
      onFilesChanged(allFiles, imageType)
      
      // L'état local sera mis à jour via le useEffect qui synchronise depuis pendingFilesProp
    },
    [
      imageType,
      onFilesChanged,
      errorToast,
      pendingFiles,
      blobUrls
    ]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: undefined, // Permettre plusieurs fichiers
    multiple: true,
    disabled: disabled
  })

  const handleRemove = useCallback((imageItem: ImageItem) => {
    if (imageItem.type === 'existing') {
      // Supprimer une image existante
      setExistingImages((prev) => prev.filter((url) => url !== imageItem.url))
      if (onImageRemoved) {
        onImageRemoved(imageItem.id, imageType)
      }
    } else if (imageItem.type === 'pending' && imageItem.file) {
      // Supprimer un fichier en attente
      const fileToRemove = imageItem.file
      const currentFilesArray = Array.from(pendingFiles.values())
      
      // Trouver l'index du fichier à supprimer
      const fileIndex = currentFilesArray.findIndex((file) => {
        return (
          file.name === fileToRemove.name &&
          file.size === fileToRemove.size &&
          file.lastModified === fileToRemove.lastModified
        )
      })
      
      if (fileIndex !== -1) {
        // Créer un nouveau tableau sans le fichier à supprimer
        const remainingFiles = currentFilesArray.filter((_, index) => index !== fileIndex)
        
        // Révoquer la blob URL du fichier supprimé en utilisant l'ID
        const idToRemove = getFileId(fileToRemove, fileIndex)
        const blobUrlToRemove = blobUrls.get(idToRemove)
        if (blobUrlToRemove) {
          URL.revokeObjectURL(blobUrlToRemove)
        }
        
        // Notifier le parent avec les fichiers restants
        onFilesChanged(remainingFiles, imageType)
        
        // Notifier aussi pour la suppression
        if (onImageRemoved) {
          onImageRemoved(imageItem.id, imageType)
        }
      }
    }
  }, [imageType, onImageRemoved, onFilesChanged, pendingFiles, blobUrls, getFileId])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {imageTypeLabel}
        </label>
      </div>

      {/* Afficher toutes les images (existantes + en attente) */}
      {imageItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {imageItems.map((imageItem) => (
            <div key={imageItem.id} className="relative w-full">
              <div className="relative w-full aspect-square rounded-lg border overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src={imageItem.url}
                  alt={`${imageTypeLabel} ${imageItem.id}`}
                  fill
                  className="object-cover"
                />
                {/* Badge pour indiquer si c'est en attente */}
                {imageItem.type === 'pending' && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                    En attente
                  </div>
                )}
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(imageItem)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Zone de drop pour ajouter une nouvelle image */}
      {!disabled && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : disabled
              ? 'border-gray-300 bg-gray-100 cursor-not-allowed dark:border-gray-600 dark:bg-gray-800'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Camera
              size={24}
              className="text-gray-500 dark:text-gray-400"
            />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isDragActive
                ? "Déposez les images ici..."
                : 'Cliquez ou glissez-déposez une ou plusieurs images'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              JPEG, PNG, GIF, WebP (max 10MB par image)
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Les images seront uploadées lors de l'enregistrement du formulaire
            </p>
          </div>
        </div>
      )}

      {(error || uploadError) && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {uploadError || error}
        </p>
      )}
    </div>
  )
}

