'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateBackofficeUser, getAllArtists } from '@/app/actions/prisma/prismaActions'
import { 
  getShopifyCollectionByTitle,
  updateShopifyCollection,
  createShopifyCollection
} from '@/app/actions/shopify/shopifyActions'
import { BackofficeUser, Artist } from '@prisma/client'
import styles from './EditUserForm.module.scss'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'

// Schéma de validation
const formSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Format d\'email invalide'),
  role: z.string().nullable().optional(),
  isShopifyGranted: z.boolean().default(false),
  collectionDescription: z.string().optional(),
  artistId: z.number().nullable().optional()
}).refine((data) => {
  // Si le rôle est 'artist', artistId est requis
  if (data.role === 'artist') {
    return data.artistId !== null && data.artistId !== undefined
  }
  return true
}, {
  message: 'Veuillez sélectionner un artiste',
  path: ['artistId'] // Spécifie le champ concerné par l'erreur
})

type FormValues = z.infer<typeof formSchema>

interface EditUserFormProps {
  user: BackofficeUser
}

export default function EditUserForm({ user }: EditUserFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [collectionTitle, setCollectionTitle] = useState<string | null>(null)
  const [collectionDescription, setCollectionDescription] = useState<string | null>(null)
  const [initialDescription, setInitialDescription] = useState<string | null>(null)
  const [isLoadingCollection, setIsLoadingCollection] = useState(true)
  const [hasDescriptionChanged, setHasDescriptionChanged] = useState(false)
  const [artists, setArtists] = useState<Artist[]>([])
  const [isLoadingArtists, setIsLoadingArtists] = useState(true)

  // Déterminer si l'utilisateur est un administrateur
  const isAdmin = user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'administrateur'
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: user.id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || null,
      // Pour les admins, on force toujours l'accès Shopify à true
      isShopifyGranted: isAdmin ? true : user.isShopifyGranted || false,
      collectionDescription: '',
      artistId: user.artistId || null
    }
  })

  // Surveiller la valeur de isShopifyGranted pour l'affichage conditionnel
  const isShopifyGranted = isAdmin ? true : watch('isShopifyGranted')
  const currentDescription = watch('collectionDescription')
  const selectedRole = watch('role')

  // Réinitialiser artistId quand le rôle change
  useEffect(() => {
    if (selectedRole !== 'artist') {
      setValue('artistId', null)
    }
  }, [selectedRole, setValue])

  // Charger la liste des artistes
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const artistsList = await getAllArtists()
        setArtists(artistsList)
      } catch (error) {
        console.error('Erreur lors du chargement des artistes:', error)
        toast.error('Erreur lors du chargement des artistes')
      } finally {
        setIsLoadingArtists(false)
      }
    }

    fetchArtists()
  }, [])

  // Observer les changements dans la description et comparer avec la valeur initiale
  useEffect(() => {
    if (initialDescription !== null && currentDescription !== undefined) {
      setHasDescriptionChanged(currentDescription !== initialDescription)
    }
  }, [currentDescription, initialDescription])

  // Récupérer les informations de la collection basée sur le nom de l'utilisateur
  useEffect(() => {
    let isMounted = true
    setIsLoadingCollection(true)
    
    const fetchCollectionInfo = async () => {
      if (!user.firstName || !user.lastName) {
        setIsLoadingCollection(false)
        return
      }

      try {
        const collectionTitle = `${user.firstName} ${user.lastName}`.trim()
        const result = await getShopifyCollectionByTitle(collectionTitle)
        
        if (result.success && result.collection && isMounted) {
          setCollectionId(result.collection.id)
          setCollectionTitle(result.collection.title)
          
          // Stocker la description dans le state component pour l'affichage
          const description = result.collection.body_html || ''
          setCollectionDescription(description)
          setInitialDescription(description)
          
          // Utiliser setValue pour définir la valeur du formulaire
          setValue('collectionDescription', description)
          
          console.log('Collection trouvée:', result.collection)
        } else if (isMounted) {
          console.log('Aucune collection trouvée pour:', collectionTitle)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la collection:', error)
      } finally {
        if (isMounted) {
          setIsLoadingCollection(false)
        }
      }
    }

    fetchCollectionInfo()
    
    // Nettoyage pour éviter des mises à jour sur un composant démonté
    return () => {
      isMounted = false
    }
  }, [user.firstName, user.lastName, setValue])

  // Fonction de soumission du formulaire
  const onSubmit = async (data: FormValues) => {
    console.log('Début de la soumission du formulaire', data)
    setIsSubmitting(true)

    try {
      // Vérifier que toutes les données sont présentes
      if (!data || !data.id) {
        throw new Error('Données de formulaire incomplètes')
      }

      // S'assurer que tous les champs requis sont présents
      const payload = {
        id: data.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        role: data.role || null,
        // Pour les admins, on force toujours l'accès Shopify à true
        isShopifyGranted: isAdmin ? true : data.isShopifyGranted,
        walletAddress: user.walletAddress || '',
        artistId: data.artistId || null
      }

      console.log('Payload à envoyer:', payload)

      // Mettre à jour l'utilisateur avec le payload complet
      const userResult = await updateBackofficeUser(payload)

      if (!userResult.success) {
        throw new Error(userResult.message)
      }

      // Si l'accès Shopify est accordé ET que l'utilisateur n'est PAS un administrateur, vérifier/gérer la collection
      if (data.isShopifyGranted && !isAdmin) {
        const collectionTitle = `${data.firstName} ${data.lastName}`.trim()
        
        if (!collectionId) {
          // Aucune collection existante - créer une nouvelle collection
          console.log(`Création d'une nouvelle collection pour: ${collectionTitle}`)
          
          try {
            const createResult = await createShopifyCollection(collectionTitle)
            
            if (!createResult.success) {
              console.error('Erreur lors de la création de la collection:', createResult.message)
              toast.error(`L'utilisateur a été mis à jour mais la création de collection a échoué: ${createResult.message}`)
            } else {
              console.log('Collection créée avec succès:', createResult.collection)
              toast.success('Utilisateur mis à jour et nouvelle collection créée')
            }
          } catch (createError: any) {
            console.error('Erreur lors de la création de la collection:', createError)
            toast.error(`L'utilisateur a été mis à jour mais la création de collection a échoué`)
          }
        } else if (hasDescriptionChanged) {
          // Collection existante avec description modifiée - mettre à jour
          console.log('Mise à jour de la description de collection:', data.collectionDescription)
          
          const updateResult = await updateShopifyCollection(collectionId, {
            description: data.collectionDescription || ''
          })
          
          if (!updateResult.success) {
            console.error('Erreur lors de la mise à jour de la collection:', updateResult.message)
            toast.error('Erreur lors de la mise à jour de la collection')
          } else {
            toast.success('Utilisateur et collection mis à jour avec succès')
          }
        } else {
          // Collection existante sans modification - ne rien faire
          toast.success('Utilisateur mis à jour avec succès')
        }
      } else {
        // Accès Shopify non accordé ou utilisateur admin
        toast.success('Utilisateur mis à jour avec succès')
      }
      
      // Rediriger après 1 seconde
      setTimeout(() => {
        router.push('/shopify/users')
        router.refresh()
      }, 1000)
      
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error)
      toast.error(error.message || 'Une erreur est survenue lors de la mise à jour')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>Modifier l'utilisateur</h1>
          <p className={styles.formSubtitle}>
            Modifier les informations de {user.firstName} {user.lastName}
          </p>
        </div>

        {/* Champ caché pour stocker la description initiale */}
        <input 
          type="hidden"
          id="initialDescription"
          value={initialDescription || ''}
        />

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="firstName" className={styles.formLabel}>
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              {...register('firstName')}
              className={`${styles.formInput} ${errors.firstName ? styles.formInputError : ''}`}
            />
            {errors.firstName && (
              <p className={styles.formError}>{errors.firstName.message}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="lastName" className={styles.formLabel}>
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              {...register('lastName')}
              className={`${styles.formInput} ${errors.lastName ? styles.formInputError : ''}`}
            />
            {errors.lastName && (
              <p className={styles.formError}>{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.formLabel}>
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={`${styles.formInput} ${errors.email ? styles.formInputError : ''}`}
          />
          {errors.email && (
            <p className={styles.formError}>{errors.email.message}</p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="role" className={styles.formLabel}>
            Rôle
          </label>
          <select
            id="role"
            {...register('role')}
            className={styles.formSelect}
          >
            <option value="">Sélectionnez un rôle</option>
            <option value="admin">Administrateur</option>
            <option value="artist">Artiste</option>
            <option value="galleryManager">Gestionnaire de galerie</option>
          </select>
        </div>

        {/* Liste déroulante des artistes si le rôle est "artist" */}
        {selectedRole === 'artist' && (
          <div className={styles.formGroup}>
            <label htmlFor="artistId" className={styles.formLabel}>
              Artiste associé
            </label>
            {isLoadingArtists ? (
              <div className={styles.loadingContainer}>
                <LoadingSpinner message="Chargement des artistes..." />
              </div>
            ) : (
              <>
                <select
                  id="artistId"
                  {...register('artistId', {
                    required: selectedRole === 'artist' ? 'Veuillez sélectionner un artiste' : false,
                    valueAsNumber: true
                  })}
                  className={`${styles.formSelect} ${errors.artistId ? styles.formInputError : ''}`}
                >
                  <option value="">Sélectionnez un artiste</option>
                  {artists.map((artist) => (
                    <option key={artist.id} value={artist.id}>
                      {artist.name} {artist.surname} ({artist.pseudo})
                    </option>
                  ))}
                </select>
                {errors.artistId && (
                  <p className={styles.formError}>{errors.artistId.message}</p>
                )}
              </>
            )}
          </div>
        )}

        {/* Afficher la checkbox uniquement si l'utilisateur n'est pas un administrateur */}
        {!isAdmin && (
          <div className={styles.formCheckboxGroup}>
            <input
              type="checkbox"
              id="isShopifyGranted"
              {...register('isShopifyGranted')}
              className={styles.formCheckbox}
            />
            <label htmlFor="isShopifyGranted" className={styles.formCheckboxLabel}>
              Accès Shopify accordé
            </label>
          </div>
        )}

        {/* Informations administrateur si l'utilisateur est admin */}
        {isAdmin && (
          <div className={styles.adminInfoBox}>
            <p className={styles.adminInfoText}>
              <strong>Note:</strong> En tant qu'administrateur, cet utilisateur a automatiquement accès à Shopify.
              Aucune collection personnelle n'est créée pour les administrateurs.
            </p>
          </div>
        )}

        {/* Section d'information sur la collection Shopify - conditionnelle selon isShopifyGranted ET non-admin */}
        {isShopifyGranted && !isAdmin && (
          <>
            {isLoadingCollection ? (
              <div className={styles.loadingContainer}>
                <LoadingSpinner message="Chargement des informations de la collection..." />
              </div>
            ) : collectionId ? (
              <div className={styles.collectionSection}>
                <h2 className={styles.sectionTitle}>Collection Shopify associée</h2>
                
                <div className={styles.infoBox}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>ID:</span>
                    <span className={styles.infoValue}>{collectionId}</span>
                  </div>
                  
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Titre:</span>
                    <span className={styles.infoValue}>{collectionTitle}</span>
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="collectionDescription" className={styles.formLabel}>
                    Description de la collection
                  </label>
                  <textarea
                    id="collectionDescription"
                    {...register('collectionDescription')}
                    className={styles.formTextarea}
                    rows={5}
                  />
                  <p className={styles.infoText}>
                    Cette description est affichée sur la page de la collection Shopify.<br/>
                    Vous pouvez utiliser du HTML pour mettre en forme le texte en vous aidant de l'éditeur HTML gratuit <a href="https://onlinehtmleditor.dev/" target="_blank" rel="noopener noreferrer">https://onlinehtmleditor.dev/</a>.
                  </p>
                  {hasDescriptionChanged && (
                    <p className={styles.changeIndicator}>
                      La description a été modifiée. Enregistrez pour appliquer les changements.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.noCollectionBox}>
                Aucune collection Shopify n'est associée à cet utilisateur.
                Une collection sera créée automatiquement lors de l'enregistrement.
              </div>
            )}
          </>
        )}

        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={handleCancel}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </form>
    </div>
  )
} 