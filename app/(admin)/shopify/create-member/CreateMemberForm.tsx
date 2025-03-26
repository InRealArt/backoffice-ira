'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { memberSchema, MemberFormData } from './schema'
import { createMember, checkUserExists, getAllArtists, getArtistById } from '@/app/actions/prisma/prismaActions'
import toast from 'react-hot-toast'
import { createShopifyCollection } from '@/app/actions/shopify/shopifyActions'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Button from '@/app/components/Button/Button'
import { useRouter } from 'next/navigation'
import { Artist } from '@prisma/client'

export default function CreateMemberForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uniqueError, setUniqueError] = useState<string | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [isLoadingArtists, setIsLoadingArtists] = useState(true)
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'artist',
      artistId: null
    }
  })

  // Surveiller le rôle sélectionné
  const selectedRole = watch('role')

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
  
  const onSubmit = async (data: MemberFormData) => {
    setIsSubmitting(true)
    setUniqueError(null)
    
    try {
      // Vérifier d'abord l'unicité du trio email+nom+prénom
      const uniqueCheck = await checkUserExists({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName
      })
      
      if (!uniqueCheck.unique) {
        setUniqueError(uniqueCheck.message)
        setIsSubmitting(false)
        return
      }
      
      // Si la vérification d'unicité est passée, créer le membre
      const result = await createMember(data)
      
      if (result.success) {
        if (data.role === 'artist') {
          // Récupérer les informations de l'artiste associé
          const artist = await getArtistById(data.artistId as number)
          
          if (!artist) {
            toast.error('Erreur : Artiste associé non trouvé')
            setIsSubmitting(false)
            return
          }

          const collectionName = `${artist.name} ${artist.surname}`
          const collectionResult = await createShopifyCollection(collectionName)
          
          if (collectionResult.success) {
            toast.success(`Membre créé et collection "${collectionName}" créée avec succès!`, {
              duration: 5000,
              position: window.innerWidth < 768 ? 'bottom-center' : 'top-right'
            })
          } else {
            toast.success(`Membre créé avec succès, mais la création de la collection a échoué: ${collectionResult.message}`, {
              duration: 5000,
              position: window.innerWidth < 768 ? 'bottom-center' : 'top-right'
            })
          }
        } else {
          toast.success(result.message, {
            duration: 5000,
            position: window.innerWidth < 768 ? 'bottom-center' : 'top-right'
          })
        }
        reset()
        setUniqueError(null)
      } else {
        toast.error(result.message, {
          duration: 5000,
          position: window.innerWidth < 768 ? 'bottom-center' : 'top-right'
        })
      }
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.', {
        duration: 5000,
        position: window.innerWidth < 768 ? 'bottom-center' : 'top-right'
      })
      console.error('Erreur de formulaire:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="page-content">
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Affichage de l'erreur d'unicité globale */}
            {uniqueError && (
              <div className="alert alert-danger mb-4">
                <p>{uniqueError}</p>
              </div>
            )}
            
            <div className="d-grid grid-md-2 gap-md">
              {/* Prénom */}
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  Prénom
                </label>
                <input
                  id="firstName"
                  type="text"
                  {...register('firstName')}
                  className={`form-input ${errors.firstName || uniqueError ? 'input-error' : ''}`}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="form-error text-danger">{errors.firstName.message}</p>
                )}
              </div>
              
              {/* Nom */}
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  Nom
                </label>
                <input
                  id="lastName"
                  type="text"
                  {...register('lastName')}
                  className={`form-input ${errors.lastName || uniqueError ? 'input-error' : ''}`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="form-error text-danger">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`form-input ${errors.email || uniqueError ? 'input-error' : ''}`}
                placeholder="email@exemple.com"
              />
              {errors.email && (
                <p className="form-error text-danger">{errors.email.message}</p>
              )}
            </div>
            
            {/* Type */}
            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Rôle
              </label>
              <select
                id="role"
                {...register('role')}
                className="form-select"
              >
                <option value="artist">Artiste</option>
                <option value="galleryManager">Responsable de galerie</option>
                <option value="admin">Administrateur</option>
              </select>
              {errors.role && (
                <p className="form-error text-danger">{errors.role.message}</p>
              )}
            </div>

            {/* Liste déroulante des artistes si le rôle est "artist" */}
            {selectedRole === 'artist' && (
              <div className="form-group">
                <label htmlFor="artistId" className="form-label">
                  Artiste associé
                </label>
                {isLoadingArtists ? (
                  <div className="loading-container">
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
                      className={`form-select ${errors.artistId ? 'input-error' : ''}`}
                    >
                      <option value="">Sélectionnez un artiste</option>
                      {artists.map((artist) => (
                        <option key={artist.id} value={artist.id}>
                          {artist.name} {artist.surname} ({artist.pseudo})
                        </option>
                      ))}
                    </select>
                    {errors.artistId && (
                      <p className="form-error text-danger">{String(errors.artistId.message || '')}</p>
                    )}
                  </>
                )}
              </div>
            )}
            
            <div className="form-actions mt-4 d-flex justify-content-between gap-md">
              <Button
                variant="secondary"
                onClick={() => router.push('/shopify/users')}
                disabled={isSubmitting}
                type="button"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                loadingText="Création en cours..."
              >
                Créer le membre
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 