'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/app/components/Toast/ToastContext'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { processExcelImport } from '@/lib/actions/presale-artwork-actions'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import type { ArtistName } from '@/lib/types/artist'
import { getArtistFullName } from '@/lib/utils'

// Schéma de validation pour le formulaire
const importExcelSchema = z.object({
  artistId: z.string().min(1, "Veuillez sélectionner un artiste"),
})

type ImportExcelFormValues = z.infer<typeof importExcelSchema>

interface ImportExcelFormProps {
  artists: (ArtistName & { id: number })[]
}

export default function ImportExcelForm({ artists }: ImportExcelFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { success, error } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ImportExcelFormValues>({
    resolver: zodResolver(importExcelSchema)
  })

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Vérifier que c'est bien un fichier Excel
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.oasis.opendocument.spreadsheet'
      ]
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|ods)$/i)) {
        error('Veuillez sélectionner un fichier Excel valide (.xlsx, .xls, .ods)')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Vérifier que le fichier est lisible
      try {
        const testReader = new FileReader()
        const testPromise = new Promise((resolve, reject) => {
          testReader.onload = () => resolve(true)
          testReader.onerror = () => reject(new Error('Fichier non lisible'))
          testReader.readAsArrayBuffer(file.slice(0, 100)) // Lire juste les premiers bytes pour tester
        })
        
        await testPromise
        console.log('✅ Fichier validé et lisible')
        setSelectedFile(file)
      } catch (err) {
        error('Le fichier ne peut pas être lu. Assurez-vous qu\'il n\'est pas ouvert dans Excel ou une autre application.')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
  }

  const handleCancel = () => {
    router.push('/landing/presaleArtworks')
  }

  const onSubmit = async (data: ImportExcelFormValues) => {
    if (!selectedFile) {
      error('Veuillez sélectionner un fichier Excel')
      return
    }

    console.log('🔵 Début du processus d\'import')
    console.log('📁 Fichier sélectionné:', selectedFile.name, 'Type:', selectedFile.type, 'Taille:', selectedFile.size)

    setIsSubmitting(true)

    try {
      const artist = artists.find(a => a.id.toString() === data.artistId)
      if (!artist) {
        error('Artiste non trouvé')
        setIsSubmitting(false)
        return
      }

      console.log('👤 Artiste sélectionné:', getArtistFullName(artist), 'ID:', artist.id)

      // Nouvelle approche : utiliser arrayBuffer() directement sur le File object
      console.log('📋 Lecture du fichier avec arrayBuffer()...')
      
      try {
        const arrayBuffer = await selectedFile.arrayBuffer()
        console.log('✅ ArrayBuffer obtenu, taille:', arrayBuffer.byteLength)
        
        // Convertir ArrayBuffer en base64
        const bytes = new Uint8Array(arrayBuffer)
        console.log('📊 Conversion en Uint8Array, longueur:', bytes.length)
        
        // Conversion optimisée en base64
        let binary = ''
        const len = bytes.byteLength
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64 = btoa(binary)
        
        console.log('🔐 Base64 final, longueur:', base64.length)
        console.log('🔐 Premiers caractères:', base64.substring(0, 50))
        
        // Appeler l'action server pour traiter le fichier
        console.log('🚀 Appel de l\'action serveur...')
        const result = await processExcelImport({
          artistId: artist.id,
          fileBase64: base64
        })
        
        console.log('📬 Résultat reçu du serveur:', result)

        if (result.success && 'artworks' in result && result.artworks) {
          // Gérer les traductions pour chaque œuvre créée
          const translationPromises = result.artworks.map((artwork: any) => 
            handleEntityTranslations(
              'presaleArtwork',
              artwork.id,
              {
                name: artwork.name,
                description: artwork.description
              }
            )
          )

          await Promise.all(translationPromises)

          success(`${result.count} œuvre(s) importée(s) avec succès et traductions créées`)
          router.push('/landing/presaleArtworks')
        } else {
          error('message' in result ? (result.message || 'Une erreur est survenue lors de l\'import') : 'Une erreur est survenue lors de l\'import')
        }
      } catch (readError: any) {
        console.error('❌ Erreur lors de la lecture avec arrayBuffer():', readError)
        console.error('❌ Message:', readError.message)
        console.error('❌ Stack:', readError.stack)
        
        error(`Impossible de lire le fichier : ${readError.message}. Assurez-vous que le fichier n'est pas ouvert dans Excel et qu'il n'est pas sur un emplacement synchronisé (OneDrive, Google Drive).`)
      }
    } catch (err: any) {
      console.error('❌ Erreur générale lors de l\'import:', err)
      console.error('❌ Stack:', err.stack)
      error(err.message || 'Une erreur est survenue lors de l\'import')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Import Excel d'œuvres en prévente</h1>
        <p className="page-subtitle">
          Importez plusieurs œuvres en prévente depuis un fichier Excel
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            <h2 className="form-title">Informations d'import</h2>
            <p className="text-sm text-text-secondary mb-4">
              Le fichier Excel doit contenir les colonnes suivantes : 
              <strong> Nom oeuvre, description oeuvre, Hauteur oeuvre, Largeur oeuvre, prix en euros, url oeuvre</strong>
            </p>
            
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
                {artists.map(artist => (
                  <option key={artist.id} value={artist.id.toString()}>
                    {getArtistFullName(artist)}
                  </option>
                ))}
              </select>
              {errors.artistId && (
                <p className="form-error">{errors.artistId.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="excelFile" className="form-label">
                Fichier Excel <span className="text-danger">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="excelFile"
                accept=".xlsx,.xls,.ods"
                onChange={handleFileChange}
                className="form-input"
                disabled={isSubmitting}
              />
              {selectedFile && (
                <p className="text-sm text-success mt-2">
                  ✓ Fichier sélectionné : <strong>{selectedFile.name}</strong>
                </p>
              )}
              {!selectedFile && (
                <p className="text-xs text-text-secondary mt-1">
                  Formats acceptés : .xlsx, .xls, .ods
                </p>
              )}
            </div>

            {isSubmitting && (
              <div className="mt-4 p-4 bg-surface-secondary rounded-lg">
                <div className="d-flex align-items-center gap-md mb-2">
                  <LoadingSpinner size="small" message="" inline />
                  <span className="font-medium">Traitement du fichier Excel en cours...</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Veuillez patienter pendant que nous importons et créons les traductions...
                </p>
              </div>
            )}
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
            disabled={isSubmitting || !selectedFile}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="small" message="" inline />
                Import en cours...
              </>
            ) : (
              'Importer les œuvres'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}


