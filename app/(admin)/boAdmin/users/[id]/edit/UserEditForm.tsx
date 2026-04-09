'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { updateWhiteListedUser, getAllArtists, getAllGalleries } from '@/lib/actions/prisma-actions'
import { useToast } from '@/app/components/Toast/ToastContext'
import Button from '@/app/components/Button/Button'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import type { WhiteListedUser, Artist } from '@/src/generated/prisma/browser'
import { getArtistFullName } from '@/lib/utils'
import type { ArtistListItemBase } from '@/lib/types/artist'
import { BackofficeUserRoles, roleSchema, ROLE_OPTIONS } from '@/lib/types/roles'

const editUserSchema = z.object({
  id: z.number(),
  email: z.string().email('Format d\'email invalide'),
  role: roleSchema,
  artistId: z.number().nullable().optional(),
})

type EditUserFormData = z.infer<typeof editUserSchema>

type UserWithArtist = WhiteListedUser & { artist: Artist | null }

interface UserEditFormProps {
  user: UserWithArtist
}

export default function UserEditForm({ user }: UserEditFormProps) {
  const router = useRouter()
  const { success, error } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [artists, setArtists] = useState<ArtistListItemBase[]>([])
  const [galleries, setGalleries] = useState<ArtistListItemBase[]>([])
  const [isLoadingArtists, setIsLoadingArtists] = useState(true)
  const [isLoadingGalleries, setIsLoadingGalleries] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      id: user.id,
      email: user.email,
      role: (user.role as BackofficeUserRoles) ?? BackofficeUserRoles.artist,
      artistId: user.artistId ?? null,
    },
  })

  const selectedRole = watch('role')

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const list = await getAllArtists()
        setArtists(list)
      } catch {
        // silent — list is optional
      } finally {
        setIsLoadingArtists(false)
      }
    }
    fetchArtists()
  }, [])

  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        const list = await getAllGalleries()
        setGalleries(list)
      } catch {
        // silent
      } finally {
        setIsLoadingGalleries(false)
      }
    }
    fetchGalleries()
  }, [])

  const onSubmit = async (data: EditUserFormData) => {
    setIsSubmitting(true)
    try {
      const result = await updateWhiteListedUser(data)

      if (result.success) {
        success(result.message, {
          duration: 4000,
          position: window.innerWidth < 768 ? 'bottom-center' : 'top-right',
        })
        router.push('/boAdmin/users')
      } else {
        error(result.message, {
          duration: 5000,
          position: window.innerWidth < 768 ? 'bottom-center' : 'top-right',
        })
      }
    } catch {
      error('Une erreur est survenue. Veuillez réessayer.', {
        duration: 5000,
        position: window.innerWidth < 768 ? 'bottom-center' : 'top-right',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-content">
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register('id', { valueAsNumber: true })} />

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="email@exemple.com"
              />
              {errors.email && (
                <p className="form-error text-danger">{errors.email.message}</p>
              )}
            </div>

            {/* Rôle */}
            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Rôle
              </label>
              <select id="role" {...register('role')} className="form-select">
                {ROLE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.role && (
                <p className="form-error text-danger">{errors.role.message}</p>
              )}
            </div>

            {/* Artiste associé */}
            {selectedRole === BackofficeUserRoles.artist && (
              <div className="form-group">
                <label htmlFor="artistId" className="form-label">
                  Artiste associé <span className="text-muted">(optionnel)</span>
                </label>
                {isLoadingArtists ? (
                  <div className="loading-container">
                    <LoadingSpinner message="Chargement des artistes..." />
                  </div>
                ) : (
                  <select
                    id="artistId"
                    {...register('artistId', {
                      setValueAs: (value) =>
                        value === '' || value === null || value === undefined
                          ? null
                          : Number(value),
                    })}
                    className={`form-select ${errors.artistId ? 'input-error' : ''}`}
                  >
                    <option value="">Aucun artiste</option>
                    {artists.map((artist) => (
                      <option key={artist.id} value={artist.id}>
                        {getArtistFullName(artist)}
                      </option>
                    ))}
                  </select>
                )}
                {errors.artistId && (
                  <p className="form-error text-danger">
                    {String(errors.artistId.message ?? '')}
                  </p>
                )}
              </div>
            )}

            {/* Galerie associée */}
            {(selectedRole === BackofficeUserRoles.galleryManager || selectedRole === BackofficeUserRoles.galleryLjManager) && (
              <div className="form-group">
                <label htmlFor="artistId" className="form-label">
                  Galerie associée
                </label>
                {isLoadingGalleries ? (
                  <div className="loading-container">
                    <LoadingSpinner message="Chargement des galeries..." />
                  </div>
                ) : (
                  <select
                    id="artistId"
                    {...register('artistId', {
                      required:
                        (selectedRole === BackofficeUserRoles.galleryManager || selectedRole === BackofficeUserRoles.galleryLjManager)
                          ? 'Veuillez sélectionner une galerie'
                          : false,
                      valueAsNumber: true,
                    })}
                    className={`form-select ${errors.artistId ? 'input-error' : ''}`}
                  >
                    <option value="">Sélectionnez une galerie</option>
                    {galleries.map((gallery) => (
                      <option key={gallery.id} value={gallery.id}>
                        {getArtistFullName(gallery)}
                      </option>
                    ))}
                  </select>
                )}
                {errors.artistId && (
                  <p className="form-error text-danger">
                    {String(errors.artistId.message ?? '')}
                  </p>
                )}
              </div>
            )}

            <div className="form-actions mt-4 d-flex justify-content-between gap-md">
              <Button
                variant="secondary"
                onClick={() => router.push('/boAdmin/users')}
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
                loadingText="Enregistrement..."
              >
                Enregistrer
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
