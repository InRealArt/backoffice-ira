'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import styles from './page.module.scss'

interface ConvertedImage {
  id: string
  originalName: string
  outputFileName: string
  originalSize: number
  convertedSize: number
  downloadUrl: string
  compressionRatio: number
  base64Data: string
}

export default function WebPConverterPage() {
  const [files, setFiles] = useState<File[]>([])
  const [isConverting, setIsConverting] = useState(false)
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([])
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Limiter à 5 fichiers maximum
    const newFiles = acceptedFiles.slice(0, 5 - files.length)
    
    // Vérifier les types de fichiers
    const validFiles = newFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff']
      return validTypes.includes(file.type)
    })

    if (validFiles.length !== newFiles.length) {
      setError('Certains fichiers ne sont pas des images valides')
    } else {
      setError(null)
    }

    setFiles(prev => [...prev, ...validFiles])
  }, [files.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.tiff']
    },
    maxFiles: 5,
    disabled: files.length >= 5
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const convertImages = async () => {
    if (files.length === 0) {
      setError('Aucun fichier sélectionné')
      return
    }

    setIsConverting(true)
    setError(null)

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('images', file)
      })

      const response = await fetch('/api/tools/webp-converter', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur lors de la conversion: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      setConvertedImages(result.convertedImages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsConverting(false)
    }
  }

  const clearAll = () => {
    setFiles([])
    setConvertedImages([])
    setError(null)
  }

  const downloadImage = async (image: ConvertedImage) => {
    try {
      // Créer un blob à partir des données base64
      const byteCharacters = atob(image.base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/webp' })
      
      // Créer un lien de téléchargement temporaire
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = image.outputFileName
      
      // Déclencher le téléchargement
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Nettoyer l'URL temporaire
      URL.revokeObjectURL(url)
      
      // Retirer l'image de la liste des images converties
      setConvertedImages(prev => prev.filter(img => img.id !== image.id))
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      setError('Erreur lors du téléchargement')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={styles['webp-converter-page']}>
      <div className={styles['page-header']}>
        <h1>Convertisseur WebP</h1>
        <p>Convertissez vos images au format WebP sans perte de qualité (maximum 5 images, 10MB par image)</p>
      </div>

      <div className={styles['converter-container']}>
        {/* Zone de drop */}
        <div className={styles['drop-zone-container']}>
          <div
            {...getRootProps()}
            className={`${styles['drop-zone']} ${isDragActive ? styles['active'] : ''} ${files.length >= 5 ? styles['disabled'] : ''}`}
          >
            <input {...getInputProps()} />
            <div className={styles['drop-zone-content']}>
              <div className={styles['drop-icon']}>📁</div>
              <p>
                {isDragActive
                  ? 'Déposez les images ici...'
                  : files.length >= 5
                  ? 'Maximum 5 images atteint'
                  : 'Cliquez pour sélectionner vos images'
                }
              </p>
              <p className={styles['file-types']}>Formats supportés: JPEG, PNG, GIF, BMP, TIFF (max 10MB par image)</p>
            </div>
          </div>
        </div>

        {/* Liste des fichiers sélectionnés */}
        {files.length > 0 && (
          <div className={styles['files-list']}>
            <h3>Images sélectionnées ({files.length}/5)</h3>
            <div className={styles['files-grid']}>
              {files.map((file, index) => (
                <div key={index} className={styles['file-item']}>
                  <div className={styles['file-preview']}>
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className={styles['preview-image']}
                    />
                  </div>
                  <div className={styles['file-info']}>
                    <p className={styles['file-name']}>{file.name}</p>
                    <p className={styles['file-size']}>{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    disabled={isConverting}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      cursor: isConverting ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)',
                      transition: 'all 0.3s ease',
                      zIndex: 10,
                      opacity: isConverting ? 0.5 : 1
                    }}
                    onMouseOver={(e) => {
                      if (!isConverting) {
                        e.currentTarget.style.background = '#c82333'
                        e.currentTarget.style.transform = 'scale(1.1)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.5)'
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isConverting) {
                        e.currentTarget.style.background = '#dc3545'
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 53, 69, 0.3)'
                      }
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Boutons d'action - Version simplifiée */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center', 
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '2px solid #007bff'
        }}>
          <button
            onClick={convertImages}
            disabled={isConverting}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: isConverting ? 'not-allowed' : 'pointer',
              opacity: isConverting ? 0.6 : 1,
              minWidth: '200px'
            }}
          >
            {isConverting ? 'Conversion en cours...' : `Convertir ${files.length} image(s) en WebP`}
          </button>
          
          <button
            onClick={clearAll}
            disabled={isConverting}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: isConverting ? 'not-allowed' : 'pointer',
              opacity: isConverting ? 0.6 : 1
            }}
          >
            Tout effacer
          </button>
          
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className={styles['error-message']}>
            <p>❌ {error}</p>
          </div>
        )}

        {/* Résultats de conversion */}
        {convertedImages.length > 0 && (
          <div className={styles['conversion-results']}>
            <h3>Images converties</h3>
            <div className={styles['results-grid']}>
              {convertedImages.map((image) => (
                <div key={image.id} className={styles['result-item']}>
                  <div className={styles['result-preview']}>
                    <img
                      src={image.downloadUrl}
                      alt={image.originalName}
                      className={styles['result-image']}
                    />
                  </div>
                  <div className={styles['result-info']}>
                    <p className={styles['result-name']}>{image.outputFileName}</p>
                    <div className={styles['size-comparison']}>
                      <p className={styles['original-size']}>
                        Original: {formatFileSize(image.originalSize)}
                      </p>
                      <p className={styles['converted-size']}>
                        WebP: {formatFileSize(image.convertedSize)}
                      </p>
                      <p className={styles['compression-ratio']}>
                        Compression: {image.compressionRatio.toFixed(1)}%
                      </p>
                    </div>
                    <button
                      onClick={() => downloadImage(image)}
                      className={styles['download-btn']}
                      style={{
                        display: 'inline-block',
                        background: '#28a745',
                        color: 'white',
                        textDecoration: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        border: 'none',
                        transition: 'background-color 0.3s ease',
                        width: '100%'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#218838'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#28a745'
                      }}
                    >
                      📥 Télécharger {image.outputFileName}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
