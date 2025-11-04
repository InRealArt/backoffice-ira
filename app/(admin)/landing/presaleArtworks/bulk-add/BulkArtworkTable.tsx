'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { AlertCircle, CheckCircle } from 'lucide-react'
import type { ArtworkData } from './BulkAddForm'

interface BulkArtworkTableProps {
  artworksData: ArtworkData[]
  onDataChange: (data: ArtworkData[]) => void
  isSubmitting: boolean
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
          className="object-cover rounded"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
      <span className="text-xs text-green-600 dark:text-green-400">✓</span>
    </div>
  )
}

export default function BulkArtworkTable({ 
  artworksData, 
  onDataChange, 
  isSubmitting 
}: BulkArtworkTableProps) {
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({})

  const updateArtwork = (index: number, field: keyof ArtworkData, value: string) => {
    const newData = [...artworksData]
    newData[index] = {
      ...newData[index],
      [field]: value
    }
    onDataChange(newData)
    
    // Valider l'œuvre mise à jour
    validateArtwork(index, newData[index])
  }

  const validateArtwork = (index: number, artwork: ArtworkData) => {
    const errors: string[] = []
    
    if (!artwork.name.trim()) {
      errors.push('Le nom est requis')
    }
    
    if (!artwork.imageUrl.trim()) {
      errors.push('L\'URL de l\'image est requise')
    } else {
      try {
        new URL(artwork.imageUrl)
      } catch {
        errors.push('L\'URL de l\'image doit être valide')
      }
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

    setValidationErrors(prev => ({
      ...prev,
      [index]: errors
    }))
  }

  // Valider toutes les œuvres au montage
  useEffect(() => {
    artworksData.forEach((artwork, index) => {
      validateArtwork(index, artwork)
    })
  }, [])

  const getRowStatus = (index: number) => {
    const errors = validationErrors[index] || []
    if (errors.length === 0) {
      return 'valid'
    }
    return 'error'
  }

  const getTotalErrors = () => {
    return Object.values(validationErrors).reduce((total, errors) => total + errors.length, 0)
  }

  return (
    <div className="form-card">
      <div className="card-content">
        <div className="form-group">
          <h3 className="form-title">Saisie des données des œuvres</h3>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-sm text-text-secondary">
              {artworksData.length} œuvre{artworksData.length > 1 ? 's' : ''} • 
              {getTotalErrors() === 0 ? (
                <span className="text-green-600 dark:text-green-400 ml-1">
                  <CheckCircle size={16} className="inline mr-1" />
                  Toutes les données sont valides
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400 ml-1">
                  <AlertCircle size={16} className="inline mr-1" />
                  {getTotalErrors()} erreur{getTotalErrors() > 1 ? 's' : ''} à corriger
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-[50px]">#</th>
                <th>Nom de l'œuvre *</th>
                <th>Description</th>
                <th className="w-[100px]">Hauteur (cm)</th>
                <th className="w-[100px]">Largeur (cm)</th>
                <th className="w-[100px]">Prix (€)</th>
                <th>URL de l'image *</th>
              </tr>
            </thead>
            <tbody>
              {artworksData.map((artwork, index) => {
                const status = getRowStatus(index)
                const errors = validationErrors[index] || []
                
                return (
                  <tr key={index} className={status === 'error' ? 'error-row' : ''}>
                    <td className="text-center font-bold">
                      {index + 1}
                    </td>
                    
                    <td>
                      <input
                        type="text"
                        value={artwork.name}
                        onChange={(e) => updateArtwork(index, 'name', e.target.value)}
                        className={`form-input ${errors.some(e => e.includes('nom')) ? 'input-error' : ''}`}
                        placeholder="Nom de l'œuvre"
                        disabled={isSubmitting}
                      />
                    </td>
                    
                    <td>
                      <textarea
                        value={artwork.description}
                        onChange={(e) => updateArtwork(index, 'description', e.target.value)}
                        className="form-textarea"
                        placeholder="Description..."
                        rows={2}
                        disabled={isSubmitting}
                      />
                    </td>
                    
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={artwork.height}
                        onChange={(e) => updateArtwork(index, 'height', e.target.value)}
                        className={`form-input ${errors.some(e => e.includes('hauteur')) ? 'input-error' : ''}`}
                        placeholder="70"
                        disabled={isSubmitting}
                      />
                    </td>
                    
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={artwork.width}
                        onChange={(e) => updateArtwork(index, 'width', e.target.value)}
                        className={`form-input ${errors.some(e => e.includes('largeur')) ? 'input-error' : ''}`}
                        placeholder="50"
                        disabled={isSubmitting}
                      />
                    </td>
                    
                    <td>
                      <input
                        type="text"
                        value={artwork.price}
                        onChange={(e) => updateArtwork(index, 'price', e.target.value)}
                        className={`form-input ${errors.some(e => e.includes('prix')) ? 'input-error' : ''}`}
                        placeholder="1500"
                        disabled={isSubmitting}
                      />
                    </td>
                    
                    <td>
                      <div className="flex flex-col gap-2">
                        <input
                          type="url"
                          value={artwork.imageUrl}
                          onChange={(e) => updateArtwork(index, 'imageUrl', e.target.value)}
                          className={`form-input ${errors.some(e => e.includes('image')) ? 'input-error' : ''}`}
                          placeholder="https://example.com/image.jpg"
                          disabled={isSubmitting}
                        />
                        {artwork.imageUrl && (
                          <div className="flex justify-center">
                            <ImageThumbnail url={artwork.imageUrl} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {getTotalErrors() > 0 && (
          <div className="form-group">
            <div className="p-4 bg-background-light dark:bg-background-light border border-red-300 dark:border-red-700 rounded-md mt-4">
              <h5 className="text-red-600 dark:text-red-400 mb-3 text-base font-semibold m-0">
                Erreurs à corriger :
              </h5>
              <div>
                {Object.entries(validationErrors).map(([index, errors]) => (
                  errors.length > 0 && (
                    <div key={index} className="mb-2">
                      <strong className="text-red-600 dark:text-red-400">Œuvre {parseInt(index) + 1} :</strong>
                      <ul className="mt-1 ml-4 list-disc text-red-700 dark:text-red-300">
                        {errors.map((error, errorIndex) => (
                          <li key={errorIndex} className="form-error">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
