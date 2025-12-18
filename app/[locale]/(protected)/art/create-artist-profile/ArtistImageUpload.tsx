'use client'

import { useCallback, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Camera } from 'lucide-react'

interface ArtistImageUploadProps {
  onFileSelect: (file: File | null) => void
  onDelete?: () => void
  previewUrl?: string | null
  error?: string
  allowDelete?: boolean
}

export default function ArtistImageUpload({ onFileSelect, onDelete, previewUrl, error, allowDelete = false }: ArtistImageUploadProps) {
  const t = useTranslations('art.imageUpload')
  const [localPreview, setLocalPreview] = useState<string | null>(previewUrl || null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [hasLocalFile, setHasLocalFile] = useState(false)

  // Mettre à jour localPreview quand previewUrl change (seulement si aucun fichier local n'est sélectionné)
  useEffect(() => {
    if (!hasLocalFile) {
      setLocalPreview(previewUrl || null)
    }
  }, [previewUrl, hasLocalFile])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      // Vérifier le type de fichier
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        onFileSelect(null)
        return
      }

      // Vérifier la taille (max 10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        setLocalError(t('errors.imageTooLarge'))
        onFileSelect(null)
        return
      }

      setLocalError(null)
      setHasLocalFile(true)
      
      // Créer une preview locale
      const reader = new FileReader()
      reader.onloadend = () => {
        setLocalPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      onFileSelect(file)
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    multiple: false
  })

  const handleRemove = () => {
    setLocalPreview(null)
    setHasLocalFile(false)
    onFileSelect(null)
    if (onDelete && allowDelete) {
      onDelete()
    }
  }

  const displayPreview = localPreview || previewUrl

  return (
    <div className="form-group">
      <label className="form-label">{t('profilePhoto')} *</label>

      {displayPreview ? (
        <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
          <Image
            src={displayPreview}
            alt={t('preview')}
            fill
            style={{ objectFit: 'cover' }}
          />
          <button
            type="button"
            onClick={handleRemove}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✕ {t('remove')}
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? '#4dabf7' : '#ccc'}`,
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? '#f0f8ff' : '#fafafa',
            transition: 'all 0.2s ease'
          }}
        >
          <input {...getInputProps()} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={32} color="#666" />
            <p style={{ margin: 0, fontWeight: 600 }}>
              {isDragActive ? t('dropHere') : t('clickOrDrag')}
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
              {t('formats')}
            </p>
          </div>
        </div>
      )}

      {(error || localError) && (
        <p className="form-error" style={{ marginTop: '0.5rem' }}>{localError || error}</p>
      )}
    </div>
  )
}

