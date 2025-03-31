'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { artworkSchema, ArtworkFormData } from './schema'
import { createArtwork } from '@/lib/actions/shopify-actions'
import toast from 'react-hot-toast'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import styles from './ArtworkCreationForm.module.scss'
import { getBackofficeUserByEmail, createItemRecord, saveAuthCertificate } from '@/lib/actions/prisma-actions'
import { pdfjs } from 'react-pdf'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { TagInput } from '@/app/components/Tag/TagInput'


// Configuration du worker PDF.js (nécessaire pour react-pdf)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function ArtworkCreationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewCertificate, setPreviewCertificate] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [hasIntellectualProperty, setHasIntellectualProperty] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const certificateInputRef = useRef<HTMLInputElement>(null)
  const { user } = useDynamicContext()
  const [formErrors, setFormErrors] = useState<any>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm<ArtworkFormData>({
    resolver: zodResolver(artworkSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      artist: '',
      medium: '',
      width: '',
      height: '',
      year: new Date().getFullYear().toString(),
      creationDate: '',
      intellectualProperty: false,
      intellectualPropertyEndDate: '',
      edition: '',
      images: undefined,
      certificate: undefined
    }
  })
  
  // Observer la valeur de la propriété intellectuelle
  const intellectualProperty = watch('intellectualProperty')
  
  // Mettre à jour l'état local quand le champ change
  useEffect(() => {
    setHasIntellectualProperty(!!intellectualProperty)
  }, [intellectualProperty])
  
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      console.log('Erreurs de validation détectées:', errors)
    } else {
      setFormErrors(null)
    }
  }, [errors])
  
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
      setValue('certificate', null, { shouldValidate: true })
      return
    }
    
    const file = files[0]
    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés pour le certificat d\'authenticité')
      if (certificateInputRef.current) {
        certificateInputRef.current.value = ''
      }
      setPreviewCertificate(null)
      setValue('certificate', null, { shouldValidate: true })
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
    console.log('Début de la soumission du formulaire', data) // Log de débogage
    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      
      // Ajouter les champs textuels
      Object.entries(data).forEach(([key, value]) => {
        //console.log('Traitement du champ:', key, value) // Log de débogage
        if (key !== 'images' && key !== 'certificate' && key !== 'tags' && value !== undefined) {
          if (key === 'creationDate' || key === 'intellectualPropertyEndDate') {
            if (value) {
              formData.append(key, new Date(value as string).toISOString())
            }
          } else {
            formData.append(key, String(value))
          }
        }
      })
      
      // Ajouter les tags
      if (tags.length > 0) {
        //console.log('Ajout des tags:', tags) // Log de débogage
        formData.append('tags', tags.join(','))
      }
      
      // Ajouter les images
      if (data.images && data.images instanceof FileList && data.images.length > 0) {
        //console.log('Ajout des images:', data.images.length, 'fichiers') // Log de débogage
        Array.from(data.images).forEach((file, index) => {
          formData.append(`image-${index}`, file)
        })
      }
      
      // Ajouter le certificat
      if (data.certificate && data.certificate instanceof FileList && data.certificate.length > 0) {
        //console.log('Ajout du certificat') // Log de débogage
        formData.append('certificate', data.certificate[0])
      }
      
      // Ajouter l'email
      formData.append('userEmail', user?.email || '')
      
      //console.log('Envoi de la requête au serveur') // Log de débogage
      const result = await createArtwork(formData)
      console.log('Réponse du serveur:', result) // Log de débogage
      
      if (result.success) {
        if (result.productId && user?.email) {
          try {
            const backofficeUser = await getBackofficeUserByEmail(user.email)
            
            if (backofficeUser) {
              const newItem = await createItemRecord(
                backofficeUser.id, 
                result.productId, 
                'created',
                tags,
                {
                  height: data.height ? parseFloat(data.height) : undefined,
                  width: data.width ? parseFloat(data.width) : undefined,
                  intellectualProperty: !!data.intellectualProperty,
                  intellectualPropertyEndDate: data.intellectualPropertyEndDate ? new Date(data.intellectualPropertyEndDate) : null,
                  creationDate: data.creationDate ? new Date(data.creationDate) : null,
                  priceBeforeTax: data.price ? parseInt(data.price, 10) : 0,
                  artworkSupport: data.medium || null 
                }
              )
              
              if (data.certificate && data.certificate instanceof FileList && 
                  data.certificate.length > 0 && newItem?.item?.id) {
                const certificateFile = data.certificate[0]
                const arrayBuffer = await certificateFile.arrayBuffer()
                const buffer = new Uint8Array(arrayBuffer)
                await saveAuthCertificate(newItem.item.id, buffer)
              }
            }
          } catch (itemError) {
            console.error('Erreur lors de la création de l\'item:', itemError)
            toast.error('Erreur lors de la création de l\'item')
          }
        }
        
        toast.success(`L'œuvre "${data.title}" a été créée avec succès!`)
        handleResetForm()
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
  
  // Ajouter cette fonction après les imports
  const scrollToError = (errors: any) => {
    const firstError = Object.keys(errors)[0]
    const element = document.getElementById(firstError)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.focus()
    }
  }
  
  // Modifier le handleFormSubmit
  const handleFormSubmit = handleSubmit(onSubmit, (errors) => {
    console.log('Erreurs de validation:', errors)
    
    // Identifier et afficher les champs manquants
    const missingFields = Object.keys(errors).map(key => {
      const fieldNames: Record<string, string> = {
        title: 'Titre',
        description: 'Description',
        price: 'Prix',
        artist: 'Artiste',
        medium: 'Support/Medium',
        images: 'Images',
        certificate: 'Certificat d\'authenticité'
      }
      return fieldNames[key]
    }).filter(Boolean)

    if (missingFields.length > 0) {
      // toast.error(`Champs obligatoires manquants : ${missingFields.join(', ')}`, {
      //   duration: 5000,
      //   position: 'top-center'
      // })
      
      // Faire défiler jusqu'au premier champ en erreur
      scrollToError(errors)
    }
  })
  
  const handleResetForm = () => {
    reset()
    setPreviewImages([])
    setPreviewCertificate(null)
    setTags([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (certificateInputRef.current) {
      certificateInputRef.current.value = ''
    }
  }
  
  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleFormSubmit} noValidate>
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
              required
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
            
            {/* Date de création */}
            <div className={styles.formGroup}>
              <label htmlFor="creationDate" className={styles.formLabel}>
                Date de création
              </label>
              <input
                id="creationDate"
                type="date"
                {...register('creationDate')}
                className={`${styles.formInput} ${errors.creationDate ? styles.formInputError : ''}`}
              />
              {errors.creationDate && (
                <p className={styles.formError}>{errors.creationDate.message}</p>
              )}
            </div>
          </div>
          
          <div className={styles.formGrid}>
            {/* Largeur */}
            <div className={styles.formGroup}>
              <label htmlFor="width" className={styles.formLabel}>
                Largeur (cm)
              </label>
              <input
                id="width"
                type="number"
                step="0.01"
                {...register('width')}
                className={`${styles.formInput} ${errors.width ? styles.formInputError : ''}`}
                placeholder="80.5"
              />
              {errors.width && (
                <p className={styles.formError}>{errors.width.message}</p>
              )}
            </div>
            
            {/* Hauteur */}
            <div className={styles.formGroup}>
              <label htmlFor="height" className={styles.formLabel}>
                Hauteur (cm)
              </label>
              <input
                id="height"
                type="number"
                step="0.01"
                {...register('height')}
                className={`${styles.formInput} ${errors.height ? styles.formInputError : ''}`}
                placeholder="100.0"
              />
              {errors.height && (
                <p className={styles.formError}>{errors.height.message}</p>
              )}
            </div>
            
            {/* Poids */}
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
          
          {/* Propriété intellectuelle */}
          <div className={styles.formGroup}>
            <div className={styles.checkboxContainer}>
              <input
                id="intellectualProperty"
                type="checkbox"
                {...register('intellectualProperty')}
                className={styles.formCheckbox}
              />
              <label htmlFor="intellectualProperty" className={styles.formCheckboxLabel}>
                Droits de propriété intellectuelle réservés
              </label>
            </div>
            {errors.intellectualProperty && (
              <p className={styles.formError}>{errors.intellectualProperty.message}</p>
            )}
          </div>
          
          {/* Date de fin de propriété intellectuelle - visible uniquement si la case est cochée */}
          {hasIntellectualProperty && (
            <div className={styles.formGroup}>
              <label htmlFor="intellectualPropertyEndDate" className={styles.formLabel}>
                Date de fin des droits de propriété intellectuelle
              </label>
              <input
                id="intellectualPropertyEndDate"
                type="date"
                {...register('intellectualPropertyEndDate')}
                className={`${styles.formInput} ${errors.intellectualPropertyEndDate ? styles.formInputError : ''}`}
              />
              <p className={styles.formHelp}>
                Date à laquelle les droits de propriété intellectuelle expirent
              </p>
              {errors.intellectualPropertyEndDate && (
                <p className={styles.formError}>{errors.intellectualPropertyEndDate.message}</p>
              )}
            </div>
          )}
        </div>
        
        {/* Tags - Nouveau composant TagInput */}
        <div className={styles.formGroup}>
          <label htmlFor="tags" className={styles.formLabel}>
            Tags
          </label>
          <TagInput
            value={tags}
            onChange={setTags}
            placeholder="Ajouter des tags..."
            maxTags={10}
            className={styles.formInput}
          />
          <p className={styles.formHelp}>
            Entrez des tags et appuyez sur Entrée pour ajouter. Maximum 10 tags.
          </p>
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
            <p className={styles.formError}>{errors.images?.message ? String(errors.images.message) : 'Les images sont requises'}</p>
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
            onClick={handleResetForm}
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