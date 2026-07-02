'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Camera, X } from 'lucide-react'
import { useToast } from '@/app/components/Toast/ToastContext'
import { LANDING_IMAGE_MAX_SIZE_BYTES } from '@/lib/r2/storage'
import { getImageUrl } from '@/lib/r2/url'

interface ArtitudeMultiImageUploadProps {
  label: string
  description?: string
  files: File[]
  onFilesChange: (files: File[]) => void
  existingImages?: string[]
  onExistingImageRemove?: (path: string) => void
  disabled?: boolean
}

export default function ArtitudeMultiImageUpload({
  label,
  description,
  files,
  onFilesChange,
  existingImages = [],
  onExistingImageRemove,
  disabled = false,
}: ArtitudeMultiImageUploadProps) {
  const { error: errorToast } = useToast()
  const [blobUrls, setBlobUrls] = useState<string[]>([])

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file))
    setBlobUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [files])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      const invalidFiles = acceptedFiles.filter((file) => !validTypes.includes(file.type))
      if (invalidFiles.length > 0) {
        errorToast('Format non supporté. Utilisez JPEG, PNG, GIF ou WebP')
        return
      }

      const oversizedFiles = acceptedFiles.filter((file) => file.size > LANDING_IMAGE_MAX_SIZE_BYTES)
      if (oversizedFiles.length > 0) {
        errorToast('Certaines images sont trop volumineuses (max 4 Mo)')
        return
      }

      onFilesChange([...files, ...acceptedFiles])
    },
    [files, onFilesChange, errorToast]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: true,
    disabled,
  })

  const handleRemove = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>

      {(existingImages.length > 0 || files.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {existingImages.map((path) => {
            const url = getImageUrl(path)
            if (!url) return null
            return (
              <div key={path} className="relative w-full">
                <div className="relative w-full aspect-square rounded-lg border overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <Image src={url} alt={label} fill className="object-cover" />
                </div>
                {!disabled && onExistingImageRemove && (
                  <button
                    type="button"
                    onClick={() => onExistingImageRemove(path)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                    aria-label="Supprimer l'image"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )
          })}
          {files.map((file, index) => (
            <div key={`${file.name}-${file.lastModified}-${index}`} className="relative w-full">
              <div className="relative w-full aspect-square rounded-lg border overflow-hidden bg-gray-100 dark:bg-gray-800">
                {blobUrls[index] && (
                  <Image src={blobUrls[index]} alt={file.name} fill className="object-cover" />
                )}
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                  aria-label="Supprimer l'image"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Camera size={24} className="text-gray-500 dark:text-gray-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isDragActive
                ? 'Déposez les images ici...'
                : 'Cliquez ou glissez-déposez une ou plusieurs images'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              JPEG, PNG, GIF, WebP (max 4 Mo par image)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
