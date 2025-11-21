'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Camera } from 'lucide-react'

interface ArtistImageUploadProps {
  onFileSelect: (file: File | null) => void
  previewUrl?: string | null
  error?: string
}

export default function ArtistImageUpload({ onFileSelect, previewUrl, error }: ArtistImageUploadProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(previewUrl || null)
  const [localError, setLocalError] = useState<string | null>(null)

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
        setLocalError('L\'image est trop volumineuse (max 10MB)')
        onFileSelect(null)
        return
      }

      setLocalError(null)
      
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
    onFileSelect(null)
  }

  const displayPreview = localPreview || previewUrl

  return (
    <div className="form-group">
      <label className="form-label">Photo de profil *</label>

      {displayPreview ? (
        <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
          <Image
            src={displayPreview}
            alt="Aperçu de la photo"
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
            ✕ Supprimer
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
              {isDragActive ? 'Déposez votre photo ici...' : 'Cliquez ou glissez-déposez votre photo'}
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
              Formats: JPEG, PNG, GIF, WebP (max 10MB)
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

