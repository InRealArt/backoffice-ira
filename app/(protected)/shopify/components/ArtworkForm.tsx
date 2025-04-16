'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { artworkSchema, ArtworkFormData } from '../createArtwork/schema'
import { createArtwork } from '@/lib/actions/shopify-actions'
import toast from 'react-hot-toast'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import styles from './ArtworkForm.module.scss'
import { getBackofficeUserByEmail, createItemRecord, updateItemRecord, saveAuthCertificate } from '@/lib/actions/prisma-actions'
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
      creationYear: initialData?.creationYear || new Date().getFullYear().toString(),
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
        try {
          // Mettre à jour l'œuvre existante
          setIsSubmitting(true)
          
          // Upload des images vers Firebase si de nouvelles images ont été sélectionnées
          let mainImageUrl = '';
          if (data.images && data.images instanceof FileList && data.images.length > 0) {
            try {
              // Récupérer les informations de l'artiste pour le stockage hiérarchique
              const artistName = backofficeUser ? `${backofficeUser.firstName} ${backofficeUser.lastName}`.trim() : 'unknown';
              const artistFolder = artistName;
              const itemSlug = slug || normalizeString(data.title);
              
              const mainImage = data.images[0];
              
              // Importer dynamiquement les modules Firebase
              const { getAuth, signInAnonymously } = await import('firebase/auth');
              const { app } = await import('@/lib/firebase/config');
              const { uploadImageToFirebase } = await import('@/lib/firebase/storage');
              
              // S'authentifier avec Firebase
              const auth = getAuth(app);
              const userCredential = await signInAnonymously(auth);
              console.log('Authentification Firebase réussie, UID:', userCredential.user.uid);
              
              // Uploader l'image principale
              mainImageUrl = await uploadImageToFirebase(mainImage, {
                artistFolder,
                itemSlug,
                isMain: true
              });
              
              console.log(`Image principale uploadée: ${mainImageUrl}`);
              
              try {
                // Sauvegarder l'URL de l'image directement
                const { saveItemImages } = await import('@/lib/actions/prisma-actions');
                await saveItemImages(initialData.id as number, mainImageUrl, []);
                console.log('URL de l\'image sauvegardée dans la base de données');
              } catch (imageError) {
                console.error('Erreur lors de la sauvegarde de l\'URL de l\'image:', imageError);
                // Ne pas bloquer le flux principal si la sauvegarde de l'image échoue
              }
            } catch (uploadError) {
              console.error('Erreur lors de l\'upload de l\'image:', uploadError);
              toast.error('Erreur lors de l\'upload de l\'image');
            }
          }
          
          const result = await updateItemRecord(
            initialData.id,
            {
              name: data.title,
              height: data.height ? parseFloat(data.height) : undefined,
              width: data.width ? parseFloat(data.width) : undefined,
              weight: data.weight ? parseFloat(data.weight) : undefined,
              intellectualProperty: data.intellectualProperty,
              intellectualPropertyEndDate: data.intellectualPropertyEndDate ? new Date(data.intellectualPropertyEndDate) : null,
              creationYear: data.creationYear ? parseInt(data.creationYear, 10) : null,
              pricePhysicalBeforeTax: data.hasPhysicalOnly && data.pricePhysicalBeforeTax ? parseInt(data.pricePhysicalBeforeTax, 10) : 0,
              priceNftBeforeTax: data.hasNftOnly && data.priceNftBeforeTax ? parseInt(data.priceNftBeforeTax, 10) : 0,
              priceNftPlusPhysicalBeforeTax: data.hasNftPlusPhysical && data.priceNftPlusPhysicalBeforeTax ? parseInt(data.priceNftPlusPhysicalBeforeTax, 10) : 0,
              artworkSupport: data.medium || null,
              metaTitle: data.metaTitle,
              metaDescription: data.metaDescription,
              description: data.description || '',
              slug: slug || normalizeString(data.title),
              tags: tags,
              mainImageUrl: mainImageUrl || null
            }
          )
          
          if (result.success) {
            // Si un nouveau certificat est fourni, mettre à jour le certificat
            if (data.certificate && data.certificate instanceof FileList && data.certificate.length > 0) {
              const certificateFile = data.certificate[0]
              const arrayBuffer = await certificateFile.arrayBuffer()
              const buffer = new Uint8Array(arrayBuffer)
              await saveAuthCertificate(initialData.id, buffer)
            }
            
            toast.success(`L'œuvre "${data.title}" a été mise à jour avec succès!`)
            
            if (onSuccess) {
              onSuccess()
            }
          } else {
            toast.error(`Erreur lors de la mise à jour: ${result.message || 'Une erreur est survenue'}`)
          }
        } catch (error: any) {
          console.error('Erreur lors de la mise à jour de l\'œuvre:', error)
          toast.error(error.message || 'Une erreur est survenue lors de la mise à jour')
        }
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
        
        // Upload des images vers Firebase Storage
        let mainImageUrl = '';
        let secondaryImageUrls: string[] = [];

        try {
          // Récupérer les informations de l'artiste pour le stockage hiérarchique
          const artistName = backofficeUser ? `${backofficeUser.firstName} ${backofficeUser.lastName}`.trim() : 'unknown';
          const artistFolder = artistName;
          const itemSlug = slug || normalizeString(data.title);

          if (data.images && data.images instanceof FileList && data.images.length > 0) {
            const mainImage = data.images[0];
            const secondaryImagesArray: File[] = [];
            
            // Si nous avons des images secondaires au format File, les ajouter
            if (data.images.length > 1) {
              for (let i = 1; i < data.images.length; i++) {
                secondaryImagesArray.push(data.images[i]);
              }
            }
            
            // Importer dynamiquement les modules Firebase pour éviter les erreurs côté serveur
            const { getAuth, signInAnonymously } = await import('firebase/auth');
            const { app } = await import('@/lib/firebase/config');
            const { uploadArtworkImages } = await import('@/lib/firebase/storage');

            // S'authentifier avec Firebase en utilisant l'authentification anonyme
            // C'est la méthode la plus simple quand vos utilisateurs sont déjà authentifiés dans votre backoffice
            const auth = getAuth(app);
            try {
              console.log('Tentative d\'authentification anonyme Firebase...');
              const userCredential = await signInAnonymously(auth);
              console.log('Authentification Firebase réussie, UID:', userCredential.user.uid);
              
              // Une fois authentifié, uploader les images
              const uploadResult = await uploadArtworkImages(
                mainImage,
                secondaryImagesArray,
                {
                  artistFolder,
                  itemSlug
                }
              );
              
              // Récupérer les URLs des images
              mainImageUrl = uploadResult.mainImageUrl;
              secondaryImageUrls = uploadResult.secondaryImageUrls;
              
              console.log(`Image principale uploadée: ${mainImageUrl}`);
              console.log(`Images secondaires uploadées: ${secondaryImageUrls.length}`);
            } catch (authError) {
              console.error('Erreur lors de l\'authentification Firebase:', authError);
              toast.error('Erreur lors de l\'authentification Firebase');
              throw authError;
            }
          } else {
            console.warn('Aucune image sélectionnée pour l\'upload');
          }
        } catch (uploadError) {
          console.error("Erreur d'upload détaillée:", uploadError);
          toast.error("Erreur lors de l'upload des images. Veuillez contacter l'administrateur.");
          throw uploadError;
        }
        
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
            // Créer l'enregistrement de l'œuvre
            const newItem = await createItemRecord(
              backofficeUser.id, 
              'created',
              tags,
              {
                name: data.title,
                height: data.height ? parseFloat(data.height) : undefined,
                width: data.width ? parseFloat(data.width) : undefined,
                weight: data.weight ? parseFloat(data.weight) : undefined,
                intellectualProperty: data.intellectualProperty,
                intellectualPropertyEndDate: data.intellectualPropertyEndDate ? new Date(data.intellectualPropertyEndDate) : null,
                creationYear: data.creationYear ? parseInt(data.creationYear, 10) : null,
                pricePhysicalBeforeTax: data.hasPhysicalOnly && data.pricePhysicalBeforeTax ? parseInt(data.pricePhysicalBeforeTax, 10) : 0,
                priceNftBeforeTax: data.hasNftOnly && data.priceNftBeforeTax ? parseInt(data.priceNftBeforeTax, 10) : 0,
                priceNftPlusPhysicalBeforeTax: data.hasNftPlusPhysical && data.priceNftPlusPhysicalBeforeTax ? parseInt(data.priceNftPlusPhysicalBeforeTax, 10) : 0,
                artworkSupport: data.medium || null,
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                description: data.description || '',
                slug: slug || normalizeString(data.title),
                mainImageUrl: mainImageUrl || null
              }
            )
            
            // Si la création de l'item a réussi et que nous avons un certificat
            if (newItem && newItem.item && newItem.item.id) {
              // Si nous avons un certificat, le sauvegarder
              if (data.certificate && data.certificate instanceof FileList && data.certificate.length > 0) {
                const certificateFile = data.certificate[0];
                const arrayBuffer = await certificateFile.arrayBuffer();
                const buffer = new Uint8Array(arrayBuffer);
                await saveAuthCertificate(newItem.item.id, buffer);
              }
              
              // Si nous avons des URLs d'images Firebase, les logger pour implémentation future
              if (mainImageUrl || secondaryImageUrls.length > 0) {
                console.log(`Item créé avec succès. ID: ${newItem.item.id}`);
                console.log(`URL de l'image principale: ${mainImageUrl}`);
                console.log(`Nombre d'images secondaires: ${secondaryImageUrls.length}`);
                
                // Sauvegarder les URLs des images dans la base de données
                try {
                  const { saveItemImages } = await import('@/lib/actions/prisma-actions');
                  await saveItemImages(newItem.item.id, mainImageUrl, secondaryImageUrls);
                  console.log('URLs des images sauvegardées dans la base de données');
                } catch (imageError) {
                  console.error('Erreur lors de la sauvegarde des URLs des images:', imageError);
                  // Ne pas bloquer le flux principal si la sauvegarde des images échoue
                }
              }
            }
            
            // Enregistrer le slug dans les logs pour utilisation future
            console.log(`Œuvre "${data.title}" créée avec succès. Slug généré: ${slug}`);
            
            toast.success(`L'œuvre "${data.title}" a été créée avec succès!`);
            
            if (onSuccess) {
              onSuccess();
            } else {
              handleResetForm();
            }
          } catch (itemError) {
            console.error('Erreur lors de la création de l\'item:', itemError);
            toast.error('Erreur lors de la création de l\'item');
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
      
      {/* SEO Metadata */}
      <div className={styles.formSectionTitle}>Informations SEO</div>
      <div className={styles.formSectionContent}>
        <div className={styles.formGrid}>
          {/* Meta Title */}
          <div className={styles.formGroup}>
            <label htmlFor="metaTitle" className={styles.formLabel} data-required={true}>
              Titre SEO
              <InfoTooltip
                title="Titre SEO"
                content={
                  <div>
                    <p>Ce titre sera utilisé dans les balises meta pour améliorer le référencement. Idéalement entre 50 et 60 caractères.</p>
                    <p className={styles.tooltipExample}><strong>Exemple :</strong> "Nuit Étoilée - Peinture à l'huile par Jean Dupont | IN REAL ART"</p>
                    <p className={styles.tooltipTips}>Conseil : Incluez le nom de l'œuvre, la technique et l'artiste.</p>
                  </div>
                }
              />
            </label>
            <input
              id="metaTitle"
              type="text"
              {...register("metaTitle", { required: true })}
              className={`${styles.formInput} ${errors.metaTitle ? styles.formInputError : ''}`}
              placeholder="Titre optimisé pour les moteurs de recherche"
              maxLength={60}
            />
            {errors.metaTitle && <p className={styles.formError}>Le titre SEO est requis</p>}
          </div>
        </div>
        
        {/* Meta Description */}
        <div className={styles.formGroup}>
          <label htmlFor="metaDescription" className={styles.formLabel} data-required={true}>
            Description SEO
            <InfoTooltip
              title="Description SEO"
              content={
                <div>
                  <p>Cette description sera utilisée dans les balises meta pour améliorer le référencement. Idéalement entre 120 et 160 caractères.</p>
                  <p className={styles.tooltipExample}><strong>Exemple :</strong> "Découvrez 'Nuit Étoilée', une œuvre originale à l'huile sur toile par Jean Dupont. Créée en 2023, cette peinture expressionniste représente un paysage nocturne avec une technique unique de couches texturées."</p>
                  <p className={styles.tooltipTips}>Conseil : Mentionnez le médium, l'année, le style artistique, et ce que représente l'œuvre.</p>
                </div>
              }
            />
          </label>
          <textarea
            id="metaDescription"
            {...register("metaDescription", { required: true })}
            className={`${styles.formTextarea} ${errors.metaDescription ? styles.formInputError : ''}`}
            rows={3}
            placeholder="Description optimisée pour les moteurs de recherche"
            maxLength={160}
          />
          {errors.metaDescription && <p className={styles.formError}>La description SEO est requise</p>}
        </div>
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
            <label htmlFor="creationYear" className={styles.formLabel}>
              Date de création
            </label>
            <input
              id="creationYear"
              type="number"
              {...register("creationYear")}
              className={`${styles.formInput} ${errors.creationYear ? styles.formInputError : ''}`}
              placeholder="2023"
            />
            {errors.creationYear && <p className={styles.formError}>{errors.creationYear.message}</p>}
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