'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { artworkSchema, ArtworkFormData } from '../createArtwork/schema'
import { createArtwork } from '@/lib/actions/shopify-actions'
import toast from 'react-hot-toast'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import styles from './ArtworkForm.module.scss'
import { getBackofficeUserByEmail, createItemRecord, saveAuthCertificate } from '@/lib/actions/prisma-actions'
import { pdfjs } from 'react-pdf'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { TagInput } from '@/app/components/Tag/TagInput'
import { normalizeString } from '@/lib/utils'
// Imports qui causent des erreurs - à supprimer
// import { Button } from '@/components/ui/button'
// import { Loader2Icon, UploadIcon, XIcon } from 'lucide-react'
// import { useRouter } from 'next/navigation'

// Configuration du worker PDF.js (nécessaire pour react-pdf)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

// Composant InfoTooltip pour afficher des conseils détaillés
interface InfoTooltipProps {
  title: string;
  content: React.ReactNode;
}

function InfoTooltip({ title, content }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Fermer l'infobulle en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.tooltipContainer} ref={tooltipRef}>
      <span 
        className={styles.infoIcon} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={title}
      >
        ?
      </span>
      {isOpen && (
        <div className={styles.tooltipContent}>
          <div className={styles.tooltipHeader}>
            <h4>{title}</h4>
            <button 
              className={styles.closeTooltip}
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
          <div className={styles.tooltipBody}>
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

interface ArtworkFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id?: number;
    title?: string;
    description?: string;
    price?: number;
    metaTitle?: string;
    metaDescription?: string;
    medium?: string;
    width?: string;
    height?: string;
    weight?: string;
    year?: string;
    creationYear?: string;
    intellectualProperty?: boolean;
    intellectualPropertyEndDate?: string;
    edition?: string;
    imageUrl?: string;
    hasPhysicalOnly?: boolean;
    hasNftOnly?: boolean;
    hasNftPlusPhysical?: boolean;
    pricePhysicalBeforeTax?: string;
    priceNftBeforeTax?: string;
    priceNftPlusPhysicalBeforeTax?: string;
    slug?: string;
  };
  onSuccess?: () => void;
}

export default function ArtworkForm({ mode = 'create', initialData = {}, onSuccess }: ArtworkFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewCertificate, setPreviewCertificate] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [hasIntellectualProperty, setHasIntellectualProperty] = useState(initialData?.intellectualProperty || false)
  const [slug, setSlug] = useState(initialData?.slug || '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const certificateInputRef = useRef<HTMLInputElement>(null)
  const secondaryImagesInputRef = useRef<HTMLInputElement>(null)
  const [secondaryImages, setSecondaryImages] = useState<string[]>([])
  const { user } = useDynamicContext()
  const [formErrors, setFormErrors] = useState<any>(null)
  const isEditMode = mode === 'edit'
  
  // Log pour vérifier les données initiales
  useEffect(() => {
    if (isEditMode) {
      console.log('ArtworkForm - Données initiales reçues:', { 
        mode,
        title: initialData?.title,
        description: initialData?.description
      })
    }
  }, [isEditMode, initialData])

  // Initialiser les images en mode édition si disponibles
  useEffect(() => {
    if (isEditMode && initialData?.imageUrl) {
      setPreviewImages([initialData.imageUrl])
    }
  }, [isEditMode, initialData])

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
      title: initialData?.title || '',
      description: initialData?.description || '',
      metaTitle: initialData?.metaTitle || '',
      metaDescription: initialData?.metaDescription || '',
      medium: initialData?.medium || '',
      width: initialData?.width || '',
      height: initialData?.height || '',
      weight: initialData?.weight || '',
      year: initialData?.year || new Date().getFullYear().toString(),
      creationYear: initialData?.creationYear || '',
      intellectualProperty: initialData?.intellectualProperty || false,
      intellectualPropertyEndDate: initialData?.intellectualPropertyEndDate || '',
      edition: initialData?.edition || '',
      images: undefined,
      certificate: undefined,
      hasPhysicalOnly: initialData?.hasPhysicalOnly || false,
      hasNftOnly: initialData?.hasNftOnly || false,
      hasNftPlusPhysical: initialData?.hasNftPlusPhysical || false,
      pricePhysicalBeforeTax: initialData?.pricePhysicalBeforeTax || '',
      priceNftBeforeTax: initialData?.priceNftBeforeTax || '',
      priceNftPlusPhysicalBeforeTax: initialData?.priceNftPlusPhysicalBeforeTax || ''
    }
  })
  
  // Observer la valeur de la propriété intellectuelle
  const intellectualProperty = watch('intellectualProperty')
  
  // Observer les options de tarification pour les œuvres physiques
  const hasPhysicalOnly = watch('hasPhysicalOnly');
  const hasNftPlusPhysical = watch('hasNftPlusPhysical');
  const hasNftOnly = watch('hasNftOnly');
  const hasPhysicalArtwork = hasPhysicalOnly || hasNftPlusPhysical;
  
  // Observer la valeur du titre pour générer le slug automatiquement
  const title = watch('title')
  
  useEffect(() => {
    if (title) {
      setSlug(normalizeString(title))
    }
  }, [title])
  
  // Définir les options du toast avec fond rouge clair
  const toastErrorOptions = {
    duration: 5000,
    position: 'top-center' as const,
    style: {
      background: '#FFEBEE', // Fond rouge clair
      color: '#D32F2F',       // Texte rouge foncé
      border: '1px solid #FFCDD2', // Bordure rouge clair
      fontWeight: 500,
      padding: '16px',
    },
    icon: '⚠️',
  };

  // Mettre à jour l'état local quand le champ change
  useEffect(() => {
    setHasIntellectualProperty(!!intellectualProperty)
  }, [intellectualProperty])
  
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      console.log('Erreurs de validation détectées:', errors)
      
      // Mappez les noms de champs pour un affichage plus convivial
      const fieldNames: Record<string, string> = {
        title: 'Titre',
        description: 'Description',
        pricePhysicalBeforeTax: 'Prix - Oeuvre physique',
        priceNftBeforeTax: 'Prix - NFT',
        priceNftPlusPhysicalBeforeTax: 'Prix - NFT + Oeuvre physique',
        pricingOption: 'Option de tarification',
        medium: 'Support/Medium',
        images: 'Images',
        certificate: 'Certificat d\'authenticité',
        width: 'Largeur',
        height: 'Hauteur',
        weight: 'Poids',
        root: 'Général',
        physicalDimensions: 'Dimensions physiques (poids, largeur, hauteur)'
      }
      
      // Vérifier les différents types d'erreurs spécifiques
      const hasPricingOptionError = errors.root?.message && 
                                  typeof errors.root.message === 'string' && 
                                  errors.root.message.includes("option de tarification");
      
      const hasPhysicalDimensionsError = errors.root?.message && 
                                        typeof errors.root.message === 'string' && 
                                        errors.root.message.includes("dimensions");
      
      const hasPriceError = errors.pricePhysicalBeforeTax?.message || 
                           errors.priceNftBeforeTax?.message || 
                           errors.priceNftPlusPhysicalBeforeTax?.message;
      
      // Afficher l'erreur selon sa priorité
      if (hasPricingOptionError && errors.root?.message) {
        toast.error(String(errors.root.message), toastErrorOptions);
      } else if (hasPriceError) {
        // Afficher l'erreur de prix spécifique
        if (errors.pricePhysicalBeforeTax?.message) {
          toast.error(String(errors.pricePhysicalBeforeTax.message), toastErrorOptions);
        } else if (errors.priceNftBeforeTax?.message) {
          toast.error(String(errors.priceNftBeforeTax.message), toastErrorOptions);
        } else if (errors.priceNftPlusPhysicalBeforeTax?.message) {
          toast.error(String(errors.priceNftPlusPhysicalBeforeTax.message), toastErrorOptions);
        }
      } else if (hasPhysicalDimensionsError && errors.root?.message) {
        // Message d'erreur pour les dimensions physiques
        toast.error(String(errors.root.message), toastErrorOptions);
      } else {
        // Collecter les noms des champs en erreur
        const missingFields = Object.keys(errors)
          .map(key => fieldNames[key])
          .filter(Boolean);
        
        if (missingFields.length > 0) {
          // Afficher la liste des champs manquants
          toast.error(`Champs obligatoires manquants : ${missingFields.join(', ')}`, toastErrorOptions);
        }
      }
      
      // Faire défiler jusqu'au premier champ en erreur
      const firstError = Object.keys(errors)[0]
      const element = document.getElementById(firstError)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.focus()
      }
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
  
  const handleSecondaryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    // Ajouter les nouvelles images aux images secondaires existantes
    const newImageFiles = Array.from(files)
    const newImageUrls: string[] = []
    
    newImageFiles.forEach(file => {
      const url = URL.createObjectURL(file)
      newImageUrls.push(url)
    })
    
    setSecondaryImages(prev => [...prev, ...newImageUrls])
  }
  
  const removeSecondaryImage = (index: number) => {
    setSecondaryImages(prev => prev.filter((_, i) => i !== index))
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
    setIsSubmitting(true)
    
    try {
      if (!user?.email) {
        throw new Error('Vous devez être connecté pour créer ou modifier une œuvre')
      }
      
      // Récupérer l'utilisateur du backoffice par email
      const backofficeUser = await getBackofficeUserByEmail(user.email)
      
      if (!backofficeUser) {
        throw new Error('Utilisateur non trouvé dans le backoffice')
      }
        
      if (isEditMode && initialData?.id) {
        // TODO: Implémenter la logique de mise à jour de l'œuvre
        toast.success('Mise à jour de l\'œuvre en cours de développement')
        
        // Pour la mise à jour, on utilise également name et description pour le titre et la description
        console.log('Mise à jour de l\'œuvre avec les propriétés:', {
          id: initialData.id,
          name: data.title, // Le titre va dans name
          description: data.description,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          // Autres propriétés...
          slug // On conserve aussi le slug
        })
        
        // Simuler un succès pour le prototype
        setTimeout(() => {
          if (onSuccess) onSuccess()
        }, 2000)
      } else {
        const formData = new FormData()
        
        // Ajouter les champs textuels
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'images' && key !== 'certificate' && key !== 'tags' && value !== undefined) {
            if (key === 'intellectualPropertyEndDate') {
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
          formData.append('tags', tags.join(','))
        }
        
        // TODO: Uploader les images vers Firebase Storage
        // 1. Récupérer l'artiste associé à l'utilisateur
        // 2. Vérifier/créer le répertoire "Prénom Nom" de l'artiste
        // 3. Créer le répertoire avec le slug de l'item
        // 4. Uploader les images dans ce répertoire
        // 5. Récupérer les URLs des images

        // Simuler l'upload vers Firebase Storage (à implémenter réellement plus tard)
        console.log('💡 À implémenter: Upload des images vers Firebase Storage')
        console.log(`- Créer le dossier avec le nom de l'artiste s'il n'existe pas`)
        console.log(`- Créer le sous-dossier avec le slug "${slug}"`)
        console.log(`- Uploader les images dans ce répertoire`)
        console.log(`- Stocker les URLs dans mainImageUrl et images[]`)
        
        // Ajouter les images
        if (data.images && data.images instanceof FileList && data.images.length > 0) {
          Array.from(data.images).forEach((file, index) => {
            formData.append(`image-${index}`, file)
          })
        }
        
        // Ajouter le certificat
        if (data.certificate && data.certificate instanceof FileList && data.certificate.length > 0) {
          formData.append('certificate', data.certificate[0])
        }
        
        // Ajouter l'email
        formData.append('userEmail', user?.email || '')
        
        // Création du produit
        const result = {
          success: true,
        }

        if (result.success) {
          try {
            // Préparer le tableau d'images secondaires (pour la démo)
            const secondaryImagesArray = secondaryImages.map((url, index) => ({
              url,
              order: index + 1
            }))
            
            const newItem = await createItemRecord(
              backofficeUser.id, 
              'created',
              tags,
              {
                name: data.title,
                height: data.height ? parseFloat(data.height) : undefined,
                width: data.width ? parseFloat(data.width) : undefined,
                intellectualProperty: data.intellectualProperty,
                intellectualPropertyEndDate: data.intellectualPropertyEndDate ? new Date(data.intellectualPropertyEndDate) : null,
                creationYear: data.creationYear ? parseInt(data.creationYear, 10) : null,
                pricePhysicalBeforeTax: data.hasPhysicalOnly && data.pricePhysicalBeforeTax ? parseInt(data.pricePhysicalBeforeTax, 10) : 0,
                priceNftBeforeTax: data.hasNftOnly && data.priceNftBeforeTax ? parseInt(data.priceNftBeforeTax, 10) : 0,
                priceNftPlusPhysicalBeforeTax: data.hasNftPlusPhysical && data.priceNftPlusPhysicalBeforeTax ? parseInt(data.priceNftPlusPhysicalBeforeTax, 10) : 0,
                artworkSupport: data.medium || null,
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription
                // Les propriétés imageUrl et images qui causent des erreurs ont été retirées temporairement
                // Une fois le schéma de la table mis à jour, on pourra les ajouter
                // imageUrl: previewImages[0] || null,
                // images: secondaryImagesArray
              }
            )
            
            // Si la création de l'item a réussi et que nous avons un certificat
            if (newItem && newItem.item.id && data.certificate && data.certificate instanceof FileList && data.certificate.length > 0) {
              const certificateFile = data.certificate[0];
              const arrayBuffer = await certificateFile.arrayBuffer();
              const buffer = new Uint8Array(arrayBuffer)
              await saveAuthCertificate(newItem.item.id, buffer)
            }
            
            // Enregistrer le slug dans les logs pour utilisation future
            console.log(`Œuvre "${data.title}" créée avec succès. Slug généré: ${slug}`)
            console.log(`Images secondaires: ${secondaryImagesArray.length}`)
            
            toast.success(`L'œuvre "${data.title}" a été créée avec succès!`)
            
            if (onSuccess) {
              onSuccess()
            } else {
              handleResetForm()
            }
          } catch (itemError) {
            console.error('Erreur lors de la création de l\'item:', itemError)
            toast.error('Erreur lors de la création de l\'item')
          }
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de la soumission du formulaire:', error)
      toast.error(error.message || 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleResetForm = () => {
    reset()
    setPreviewImages([])
    setPreviewCertificate(null)
    setTags([])
    setSecondaryImages([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (certificateInputRef.current) {
      certificateInputRef.current.value = ''
    }
    if (secondaryImagesInputRef.current) {
      secondaryImagesInputRef.current.value = ''
    }
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {/* Informations de base */}
      <div className={styles.formGrid}>
        {/* Title */}
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.formLabel} data-required={true}>
            Titre
          </label>
          <input
            id="title"
            type="text"
            {...register("title", { required: true })}
            className={`${styles.formInput} ${errors.title ? styles.formInputError : ''}`}
            placeholder="Entrez le titre de l'œuvre"
          />
          {errors.title && <p className={styles.formError}>Le titre est requis</p>}
        </div>
        
        {/* Slug généré automatiquement */}
        <div className={styles.formGroup}>
          <label htmlFor="slug" className={styles.formLabel}>
            Slug
            <InfoTooltip
              title="Slug"
              content="URL simplifiée générée automatiquement à partir du titre"
            />
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            readOnly
            className={`${styles.formInput} ${styles.formInputDisabled}`}
            style={{ backgroundColor: '#f0f0f0', color: '#666', cursor: 'not-allowed' }}
          />
          <p className={styles.formHelp}>Ce champ est généré automatiquement à partir du titre</p>
        </div>
      </div>

      {/* Description */}
      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.formLabel}>
          Description
        </label>
        <textarea
          id="description"
          {...register("description")}
          className={`${styles.formTextarea} ${errors.description ? styles.formInputError : ''}`}
          rows={4}
          placeholder="Décrivez l'œuvre..."
        />
      </div>
      
      {/* Options de tarification - Fonctionnalité avancée */}
      <div className={styles.formSectionTitle}>Options de tarification</div>
      <div className={styles.formSectionContent}>
        {/* Options de type d'œuvre */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Type d'œuvre disponible</label>
          <div className={styles.pricingOptions}>
            {/* Option Œuvre physique uniquement */}
            <div className={styles.pricingOption}>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="hasPhysicalOnly"
                  {...register("hasPhysicalOnly")}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor="hasPhysicalOnly" className="font-medium">Œuvre physique uniquement</label>
              </div>
              {hasPhysicalOnly && (
                <div className="mt-2">
                  <label htmlFor="pricePhysicalBeforeTax" className="block text-sm mb-1">Prix (€ HT)</label>
                  <input
                    type="text"
                    id="pricePhysicalBeforeTax"
                    {...register("pricePhysicalBeforeTax")}
                    className={`${styles.formInput} ${errors.pricePhysicalBeforeTax ? styles.formInputError : ''}`}
                    placeholder="Prix HT"
                  />
                  {errors.pricePhysicalBeforeTax && (
                    <p className={styles.formError}>{errors.pricePhysicalBeforeTax.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Option NFT uniquement */}
            <div className={styles.pricingOption}>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="hasNftOnly"
                  {...register("hasNftOnly")}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor="hasNftOnly" className="font-medium">NFT uniquement</label>
              </div>
              {hasNftOnly && (
                <div className="mt-2">
                  <label htmlFor="priceNftBeforeTax" className="block text-sm mb-1">Prix (€ HT)</label>
                  <input
                    type="text"
                    id="priceNftBeforeTax"
                    {...register("priceNftBeforeTax")}
                    className={`${styles.formInput} ${errors.priceNftBeforeTax ? styles.formInputError : ''}`}
                    placeholder="Prix HT"
                  />
                  {errors.priceNftBeforeTax && (
                    <p className={styles.formError}>{errors.priceNftBeforeTax.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Option NFT + Œuvre physique */}
            <div className={styles.pricingOption}>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="hasNftPlusPhysical"
                  {...register("hasNftPlusPhysical")}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor="hasNftPlusPhysical" className="font-medium">NFT + Œuvre physique</label>
              </div>
              {hasNftPlusPhysical && (
                <div className="mt-2">
                  <label htmlFor="priceNftPlusPhysicalBeforeTax" className="block text-sm mb-1">Prix (€ HT)</label>
                  <input
                    type="text"
                    id="priceNftPlusPhysicalBeforeTax"
                    {...register("priceNftPlusPhysicalBeforeTax")}
                    className={`${styles.formInput} ${errors.priceNftPlusPhysicalBeforeTax ? styles.formInputError : ''}`}
                    placeholder="Prix HT"
                  />
                  {errors.priceNftPlusPhysicalBeforeTax && (
                    <p className={styles.formError}>{errors.priceNftPlusPhysicalBeforeTax.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          {errors.root && typeof errors.root.message === 'string' && errors.root.message.includes("tarification") && (
            <p className={styles.formError}>Vous devez sélectionner au moins une option de tarification</p>
          )}
        </div>
      </div>
      
      {/* Section Caractéristiques */}
      <div className={styles.formSectionTitle}>Caractéristiques</div>
      <div className={styles.formSectionContent}>
        <div className={styles.formGrid}>
          {/* Medium */}
          <div className={styles.formGroup}>
            <label htmlFor="medium" className={styles.formLabel} data-required={true}>
              Médium / Support
            </label>
            <input
              id="medium"
              type="text"
              {...register("medium", { required: true })}
              className={`${styles.formInput} ${errors.medium ? styles.formInputError : ''}`}
              placeholder="Ex: Huile sur toile, Acrylique, etc."
            />
            {errors.medium && <p className={styles.formError}>Le médium est requis</p>}
          </div>
          
          {/* Date de création */}
          <div className={styles.formGroup}>
            <label htmlFor="year" className={styles.formLabel}>
              Date de création
            </label>
            <input
              id="year"
              type="number"
              {...register("year")}
              className={`${styles.formInput} ${errors.year ? styles.formInputError : ''}`}
              placeholder="2023"
            />
            {errors.year && <p className={styles.formError}>{errors.year.message}</p>}
          </div>
        </div>
        
        <div className={styles.formGrid}>
          {/* Width */}
          <div className={styles.formGroup}>
            <label htmlFor="width" className={styles.formLabel} data-required={true}>
              Largeur (cm)
            </label>
            <input
              id="width"
              type="number"
              step="0.01"
              {...register("width", {
                required: true,
                validate: (value) => !value || parseFloat(value) > 0 || "La largeur doit être supérieure à 0",
              })}
              className={`${styles.formInput} ${errors.width ? styles.formInputError : ''}`}
              placeholder="Largeur en cm"
            />
            {errors.width && <p className={styles.formError}>{errors.width.message || "La largeur est requise"}</p>}
          </div>

          {/* Height */}
          <div className={styles.formGroup}>
            <label htmlFor="height" className={styles.formLabel} data-required={true}>
              Hauteur (cm)
            </label>
            <input
              id="height"
              type="number"
              step="0.01"
              {...register("height", {
                required: true,
                validate: (value) => !value || parseFloat(value) > 0 || "La hauteur doit être supérieure à 0",
              })}
              className={`${styles.formInput} ${errors.height ? styles.formInputError : ''}`}
              placeholder="Hauteur en cm"
            />
            {errors.height && <p className={styles.formError}>{errors.height.message || "La hauteur est requise"}</p>}
          </div>
          
          {/* Weight */}
          <div className={styles.formGroup}>
            <label htmlFor="weight" className={styles.formLabel}>
              Poids (kg)
            </label>
            <input
              id="weight"
              type="text"
              {...register("weight")}
              className={`${styles.formInput} ${errors.weight ? styles.formInputError : ''}`}
              placeholder="5.2"
            />
            {errors.weight && <p className={styles.formError}>{errors.weight.message}</p>}
          </div>
        </div>
        
        <div className={styles.formGrid}>
          {/* Édition */}
          <div className={styles.formGroup}>
            <label htmlFor="edition" className={styles.formLabel}>
              Édition/Série
            </label>
            <input
              id="edition"
              type="text"
              {...register("edition")}
              className={styles.formInput}
              placeholder="Édition limitée 2/10"
            />
          </div>
        </div>
        
        {/* Propriété intellectuelle */}
        <div className={styles.formGroup}>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="intellectualProperty"
              {...register("intellectualProperty")}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="intellectualProperty" className={styles.formLabel}>
              Droits de propriété intellectuelle réservés
            </label>
          </div>
        </div>
        
        {/* Date de fin des droits - conditionnelle */}
        {hasIntellectualProperty && (
          <div className={styles.formGroup}>
            <label htmlFor="intellectualPropertyEndDate" className={styles.formLabel}>
              Date de fin des droits
            </label>
            <input
              type="date"
              id="intellectualPropertyEndDate"
              {...register("intellectualPropertyEndDate")}
              className={`${styles.formInput} ${errors.intellectualPropertyEndDate ? styles.formInputError : ''}`}
              min={new Date().toISOString().split('T')[0]}
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
      
      {/* Tags */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Tags
        </label>
        <TagInput
          placeholder="Ajouter des tags..."
          value={tags}
          onChange={setTags}
          maxTags={10}
          className={styles.formInput}
        />
        <p className={styles.formHelp}>
          Entrez des tags et appuyez sur Entrée pour ajouter. Maximum 10 tags.
        </p>
      </div>
      
      {/* Fichiers Media */}
      <div className={styles.formGroup}>
        <label htmlFor="images" className={styles.formLabel} data-required={true}>
          Images
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
          <p className={styles.formError}>{errors.images?.message ? String(errors.images.message) : 'L\'image principale est requise'}</p>
        )}
      </div>
      
      {/* Certificat d'authenticité */}
      <div className={styles.formGroup}>
        <label htmlFor="certificate" className={styles.formLabel} data-required={true}>
          Certificat d'authenticité (PDF)
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
      
      {/* Prévisualisation des images secondaires */}
      {secondaryImages.length > 0 && (
        <div className={styles.imagePreviewContainer}>
          {secondaryImages.map((src, index) => (
            <div key={index} className={styles.imagePreview}>
              <img src={src} alt={`Image secondaire ${index + 1}`} />
              <button
                type="button"
                onClick={() => removeSecondaryImage(index)}
                className={styles.removeImageBtn}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Prévisualisation du certificat */}
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

      {/* Form Buttons */}
      <div className={styles.formActions}>
        <button 
          type="button" 
          className={styles.cancelButton}
          onClick={handleResetForm}
          disabled={isSubmitting}
        >
          Réinitialiser
        </button>
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? (isEditMode ? 'Modification en cours...' : 'Création en cours...') 
            : (isEditMode ? 'Mettre à jour l\'œuvre' : 'Créer l\'œuvre')}
        </button>
      </div>
    </form>
  )
} 