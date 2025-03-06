'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { artworkSchema, ArtworkFormData } from './schema'
import { createArtwork } from '@/app/actions/shopify/shopifyActions'
import toast from 'react-hot-toast'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import styles from './ArtworkCreationForm.module.scss'
import { getBackofficeUserByEmail, createItemRecord, saveAuthCertificate } from '@/app/actions/prisma/prismaActions'
import { pdfjs } from 'react-pdf'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Configuration du worker PDF.js (nécessaire pour react-pdf)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function ArtworkCreationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewCertificate, setPreviewCertificate] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const certificateInputRef = useRef<HTMLInputElement>(null)
  const { user } = useDynamicContext()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ArtworkFormData>({
    resolver: zodResolver(artworkSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      artist: '',
      medium: '',
      dimensions: '',
      year: new Date().getFullYear().toString(),
      edition: '',
      tags: '',
      images: undefined,
      certificate: undefined
    }
  })
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    // Prévisualisation des images
    const imageFiles = Array.from(files)
    const imageUrls: string[] = []
    
    imageFiles.forEach(file => {
      const url = URL.createObjectURL(file)
      imageUrls.push(url)
    })
    
    setPreviewImages(imageUrls)
  }
  
  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      setPreviewCertificate(null)
      setValue('certificate', undefined, { shouldValidate: true })
      return
    }
    
    const file = files[0]
    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés pour le certificat d\'authenticité')
      if (certificateInputRef.current) {
        certificateInputRef.current.value = ''
      }
      setPreviewCertificate(null)
      setValue('certificate', undefined, { shouldValidate: true })
      return
    }
    
    const url = URL.createObjectURL(file)
    setPreviewCertificate(url)
    
    // Important: définir manuellement la valeur pour react-hook-form
    setValue('certificate', e.target.files, { shouldValidate: true })
  }
  
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }
  
  const onSubmit = async (data: ArtworkFormData) => {
    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      
      // Ajouter les champs textuels
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'images' && key !== 'certificate' && value) {
          formData.append(key, value.toString())
        }
      })
      
      // Ajouter les images
      if (data.images && data.images instanceof FileList && data.images.length > 0) {
        Array.from(data.images).forEach((file, index) => {
          formData.append(`image-${index}`, file)
        })
      }
      
      // Ajouter le certificat d'authenticité
      if (data.certificate && data.certificate instanceof FileList && data.certificate.length > 0) {
        formData.append('certificate', data.certificate[0])
      }
      
      // AJOUT IMPORTANT: Ajouter manuellement l'email de l'utilisateur
      formData.append('userEmail', user?.email || '')
      
      // Envoyer au serveur
      const result = await createArtwork(formData)
      
      if (result.success) {
        // Créer un enregistrement dans la table Item
        if (result.productId && user?.email) {
          try {
            // Récupérer l'utilisateur par email
            const backofficeUser = await getBackofficeUserByEmail(user.email)
            
            if (backofficeUser) {
              // Créer l'enregistrement dans la table Item
                const newItem = await createItemRecord(backofficeUser.id, result.productId, 'created')
              
              // Sauvegarder le certificat d'authenticité dans la table AuthCertificate
              if (data.certificate && data.certificate instanceof FileList && 
                  data.certificate.length > 0 && newItem?.item?.id) {
                // Convertir le fichier PDF en Uint8Array pour stockage
                const certificateFile = data.certificate[0]
                const arrayBuffer = await certificateFile.arrayBuffer()
                const buffer = new Uint8Array(arrayBuffer)
                
                // Appeler la fonction pour sauvegarder le certificat
                await saveAuthCertificate(newItem.item.id, buffer)
                console.log(`Certificat d'authenticité sauvegardé pour l'item ${newItem.item.id}`)
              }
              
              console.log(`Enregistrement créé dans la table Item pour l'œuvre ${result.productId}`)
            } else {
              console.error('Utilisateur non trouvé pour l\'email:', user.email)
            }
          } catch (itemError) {
            console.error('Erreur lors de la création de l\'enregistrement dans Item:', itemError)
            // Ne pas bloquer le processus en cas d'erreur avec l'enregistrement Item
          }
        }
        
        toast.success(`L'œuvre "${data.title}" a été créée avec succès!`)
        reset()
        setPreviewImages([])
        setPreviewCertificate(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        if (certificateInputRef.current) {
          certificateInputRef.current.value = ''
        }
      } else {
        toast.error(`Erreur: ${result.message}`)
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'œuvre:', error)
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.formGrid}>
          {/* Titre */}
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.formLabel}>
              Titre de l'œuvre*
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={`${styles.formInput} ${errors.title ? styles.formInputError : ''}`}
              placeholder="Sans titre #12"
            />
            {errors.title && (
              <p className={styles.formError}>{errors.title.message}</p>
            )}
          </div>
          
          {/* Artiste */}
          <div className={styles.formGroup}>
            <label htmlFor="artist" className={styles.formLabel}>
              Artiste*
            </label>
            <input
              id="artist"
              type="text"
              {...register('artist')}
              className={`${styles.formInput} ${errors.artist ? styles.formInputError : ''}`}
              placeholder="Nom de l'artiste"
            />
            {errors.artist && (
              <p className={styles.formError}>{errors.artist.message}</p>
            )}
          </div>
        </div>
        
        {/* Description */}
        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.formLabel}>
            Description*
          </label>
          <textarea
            id="description"
            {...register('description')}
            className={`${styles.formTextarea} ${errors.description ? styles.formInputError : ''}`}
            rows={4}
            placeholder="Description détaillée de l'œuvre..."
          />
          {errors.description && (
            <p className={styles.formError}>{errors.description.message}</p>
          )}
        </div>
        
        {/* Section Tarification */}
        <div className={styles.formSectionTitle}>Tarification</div>
        <div className={styles.formSectionContent}>
          <div className={styles.formGroup}>
            <label htmlFor="price" className={styles.formLabel}>
              Prix (€)*
            </label>
            <input
              id="price"
              type="text"
              {...register('price')}
              className={`${styles.formInput} ${errors.price ? styles.formInputError : ''}`}
              placeholder="1500"
            />
            {errors.price && (
              <p className={styles.formError}>{errors.price.message}</p>
            )}
          </div>
        </div>
        
        {/* Section Caractéristiques */}
        <div className={styles.formSectionTitle}>Caractéristiques</div>
        <div className={styles.formSectionContent}>
          <div className={styles.formGrid}>
            {/* Support/Medium */}
            <div className={styles.formGroup}>
              <label htmlFor="medium" className={styles.formLabel}>
                Support/Medium*
              </label>
              <input
                id="medium"
                type="text"
                {...register('medium')}
                className={`${styles.formInput} ${errors.medium ? styles.formInputError : ''}`}
                placeholder="Acrylique sur toile"
              />
              {errors.medium && (
                <p className={styles.formError}>{errors.medium.message}</p>
              )}
            </div>
            
            {/* Dimensions */}
            <div className={styles.formGroup}>
              <label htmlFor="dimensions" className={styles.formLabel}>
                Dimensions (cm)*
              </label>
              <input
                id="dimensions"
                type="text"
                {...register('dimensions')}
                className={`${styles.formInput} ${errors.dimensions ? styles.formInputError : ''}`}
                placeholder="100 x 80 x 2"
              />
              {errors.dimensions && (
                <p className={styles.formError}>{errors.dimensions.message}</p>
              )}
            </div>
            
            {/* Poids - Nouveau champ */}
            <div className={styles.formGroup}>
              <label htmlFor="weight" className={styles.formLabel}>
                Poids (kg)
              </label>
              <input
                id="weight"
                type="text"
                {...register('weight')}
                className={`${styles.formInput} ${errors.weight ? styles.formInputError : ''}`}
                placeholder="5.2"
              />
              {errors.weight && (
                <p className={styles.formError}>{errors.weight.message}</p>
              )}
            </div>
          </div>
          
          <div className={styles.formGrid}>
            {/* Année */}
            <div className={styles.formGroup}>
              <label htmlFor="year" className={styles.formLabel}>
                Année de création
              </label>
              <input
                id="year"
                type="text"
                {...register('year')}
                className={`${styles.formInput} ${errors.year ? styles.formInputError : ''}`}
                placeholder="2023"
              />
              {errors.year && (
                <p className={styles.formError}>{errors.year.message}</p>
              )}
            </div>
            
            {/* Édition */}
            <div className={styles.formGroup}>
              <label htmlFor="edition" className={styles.formLabel}>
                Édition/Série
              </label>
              <input
                id="edition"
                type="text"
                {...register('edition')}
                className={`${styles.formInput} ${errors.edition ? styles.formInputError : ''}`}
                placeholder="Édition limitée 2/10"
              />
              {errors.edition && (
                <p className={styles.formError}>{errors.edition.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Tags */}
        <div className={styles.formGroup}>
          <label htmlFor="tags" className={styles.formLabel}>
            Tags (séparés par des virgules)
          </label>
          <input
            id="tags"
            type="text"
            {...register('tags')}
            className={`${styles.formInput} ${errors.tags ? styles.formInputError : ''}`}
            placeholder="abstrait, contemporain, acrylique"
          />
          {errors.tags && (
            <p className={styles.formError}>{errors.tags.message}</p>
          )}
        </div>
        
        {/* Images */}
        <div className={styles.formGroup}>
          <label htmlFor="images" className={styles.formLabel}>
            Images*
          </label>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              handleImageChange(e)
              if (e.target.files) {
                setValue('images', e.target.files, { shouldValidate: true })
              }
            }}
            ref={fileInputRef}
            className={`${styles.formFileInput} ${errors.images ? styles.formInputError : ''}`}
          />
          {errors.images && (
            <p className={styles.formError}>{errors.images.message}</p>
          )}
        </div>
        
        {/* Certificat d'authenticité */}
        <div className={styles.formGroup}>
          <label htmlFor="certificate" className={styles.formLabel}>
            Certificat d'authenticité (PDF)*
          </label>
          <input
            id="certificate"
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              handleCertificateChange(e)
              if (e.target.files) {
                setValue('certificate', e.target.files, { shouldValidate: true })
              }
            }}
            ref={certificateInputRef}
            className={`${styles.formFileInput} ${errors.certificate ? styles.formInputError : ''}`}
          />
          {errors.certificate && (
            <p className={styles.formError}>{errors.certificate?.message ? String(errors.certificate.message) : 'Le certificat est requis'}</p>
          )}
        </div>
        
        {/* Prévisualisation des images */}
        {previewImages.length > 0 && (
          <div className={styles.imagePreviewContainer}>
            {previewImages.map((src, index) => (
              <div key={index} className={styles.imagePreview}>
                <img src={src} alt={`Aperçu ${index + 1}`} />
              </div>
            ))}
          </div>
        )}
        
        {/* Prévisualisation du certificat - version simplifiée */}
        {previewCertificate && (
          <div className={styles.certificatePreviewContainer}>
            <h4>Certificat d'authenticité sélectionné</h4>
            <div className={styles.certificateInfo}>
              <p>Format: PDF</p>
              <p>Nom: {certificateInputRef.current?.files?.[0]?.name || 'document.pdf'}</p>
              <p>Taille: {((certificateInputRef.current?.files?.[0]?.size || 0) / 1024).toFixed(2)} Ko</p>
              <a 
                href={previewCertificate} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.viewPdfLink}
              >
                Voir le PDF dans un nouvel onglet
              </a>
            </div>
          </div>
        )}
        
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => {
              reset()
              setPreviewImages([])
              setPreviewCertificate(null)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
              if (certificateInputRef.current) {
                certificateInputRef.current.value = ''
              }
            }}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isSubmitting}
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            {isSubmitting ? 'Création en cours...' : 'Créer l\'œuvre'}
          </button>
        </div>
      </form>
    </div>
  )
}