'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Team } from '@/src/generated/prisma/browser'
import { updateTeamMember, updateTeamMemberVisible, deleteTeamMember } from '@/lib/actions/team-actions'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import { useToast } from '@/app/components/Toast/ToastContext'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import TranslationField from '@/app/components/TranslationField'
import OptionalImageUpload from '@/app/components/art/OptionalImageUpload'
import { DeleteActionButton } from '@/app/components/PageLayout'

// Schéma de validation
const formSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').min(1, 'L\'email est requis'),
  role: z.string().min(1, 'Le rôle est requis'),
  visible: z.boolean(),
  order: z.number().nullable().optional(),
  intro: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  linkedinUrl: z.string().url('URL LinkedIn invalide').or(z.literal('')).nullable().optional(),
  instagramUrl: z.string().url('URL Instagram invalide').or(z.literal('')).nullable().optional(),
  facebookUrl: z.string().url('URL Facebook invalide').or(z.literal('')).nullable().optional(),
  githubUrl: z.string().url('URL GitHub invalide').or(z.literal('')).nullable().optional(),
  twitterUrl: z.string().url('URL Twitter invalide').or(z.literal('')).nullable().optional(),
  websiteUrl: z.string().url('URL de site web invalide').or(z.literal('')).nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface TeamEditFormProps {
  teamMember: Team
}

export default function TeamEditForm({ teamMember }: TeamEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photo1File, setPhoto1File] = useState<File | null>(null)
  const [photo2File, setPhoto2File] = useState<File | null>(null)
  const [deletedPhoto1, setDeletedPhoto1] = useState(false)
  const [deletedPhoto2, setDeletedPhoto2] = useState(false)
  const [isDeletingMember, setIsDeletingMember] = useState(false)
  const { success, error } = useToast()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: teamMember.firstName,
      lastName: teamMember.lastName,
      email: teamMember.email,
      role: teamMember.role,
      visible: teamMember.visible,
      order: teamMember.order,
      intro: teamMember.intro || null,
      description: teamMember.description || null,
      linkedinUrl: teamMember.linkedinUrl || null,
      instagramUrl: teamMember.instagramUrl || null,
      facebookUrl: teamMember.facebookUrl || null,
      githubUrl: teamMember.githubUrl || null,
      twitterUrl: teamMember.twitterUrl || null,
      websiteUrl: teamMember.websiteUrl || null,
    }
  })

  const visible = watch('visible')

  // La suppression réelle sur R2 n'a lieu qu'après succès de la sauvegarde (voir onSubmit) :
  // marquer l'état localement évite de supprimer un fichier encore référencé si l'utilisateur
  // annule ou si la mise à jour échoue.
  const handleDeletePhoto1 = useCallback(() => {
    setDeletedPhoto1(true)
    setPhoto1File(null)
  }, [])

  const handleDeletePhoto2 = useCallback(() => {
    setDeletedPhoto2(true)
    setPhoto2File(null)
  }, [])

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    try {
      let photoUrl1: string | null = deletedPhoto1 ? null : teamMember.photoUrl1 || null
      let photoUrl2: string | null = deletedPhoto2 ? null : teamMember.photoUrl2 || null

      const { uploadTeamMemberImage } = await import('@/lib/r2/storage')

      if (photo1File) {
        photoUrl1 = await uploadTeamMemberImage(photo1File, {
          memberId: teamMember.id,
          photoSlot: 'photo1',
        })
      }

      if (photo2File) {
        photoUrl2 = await uploadTeamMemberImage(photo2File, {
          memberId: teamMember.id,
          photoSlot: 'photo2',
        })
      }

      // Remplacer l'approche avec reduce par une assignation explicite
      const formattedData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        visible: data.visible,
        order: data.order === undefined ? null : data.order,
        intro: data.intro === undefined ? null : data.intro,
        description: data.description === undefined ? null : data.description,
        photoUrl1,
        photoUrl2,
        linkedinUrl: data.linkedinUrl === undefined ? null : data.linkedinUrl,
        instagramUrl: data.instagramUrl === undefined ? null : data.instagramUrl,
        facebookUrl: data.facebookUrl === undefined ? null : data.facebookUrl,
        githubUrl: data.githubUrl === undefined ? null : data.githubUrl,
        twitterUrl: data.twitterUrl === undefined ? null : data.twitterUrl,
        websiteUrl: data.websiteUrl === undefined ? null : data.websiteUrl,
      }

      const result = await updateTeamMember(teamMember.id, formattedData)

      if (result.success) {
        // La mise à jour DB a réussi : on peut maintenant supprimer sans risque
        // l'ancien fichier R2 si l'utilisateur a explicitement retiré la photo
        // (un remplacement écrase déjà le même chemin, memberId-photoSlot, donc rien à faire dans ce cas).
        const { deleteImageFromFirebase } = await import('@/lib/r2/storage')
        if (deletedPhoto1 && !photo1File && teamMember.photoUrl1) {
          await deleteImageFromFirebase(teamMember.photoUrl1)
        }
        if (deletedPhoto2 && !photo2File && teamMember.photoUrl2) {
          await deleteImageFromFirebase(teamMember.photoUrl2)
        }

        success('Membre d\'équipe mis à jour avec succès')

        // Gestion des traductions pour le rôle et la description
        try {
          // Utiliser la fonction générique pour gérer les traductions
          await handleEntityTranslations('Team', teamMember.id, {
            role: data.role || null,
            intro: data.intro || null,
            description: data.description || null
          })
        } catch (translationError) {
          console.error('Erreur lors de la gestion des traductions:', translationError)
          // On ne bloque pas la mise à jour du membre en cas d'erreur de traduction
        }
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/landing/team')
          router.refresh()
        }, 1000)
      } else {
        error(result.message || 'Une erreur est survenue')
      }
    } catch (err: any) {
      error('Une erreur est survenue lors de la mise à jour')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/landing/team')
  }

  const handleDeleteMember = async () => {
    setIsDeletingMember(true)

    try {
      // Supprimer d'abord l'enregistrement en DB : si cet appel échoue, on ne
      // veut pas avoir déjà perdu les photos sur R2 (même logique que onSubmit).
      const result = await deleteTeamMember(teamMember.id)

      if (result.success) {
        const { deleteImageFromFirebase } = await import('@/lib/r2/storage')

        if (teamMember.photoUrl1) {
          await deleteImageFromFirebase(teamMember.photoUrl1)
        }
        if (teamMember.photoUrl2) {
          await deleteImageFromFirebase(teamMember.photoUrl2)
        }

        success('Membre d\'équipe supprimé avec succès')
        // Navigation complète (pas router.push) : une transition client Next.js
        // laisse le temps à la page d'édition actuelle de se re-rendre (le membre
        // n'existe plus en DB) et déclenche un bref notFound() avant de basculer.
        window.location.href = '/landing/team'
      } else {
        error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du membre d\'équipe:', err)
      error('Une erreur est survenue lors de la suppression')
    } finally {
      setIsDeletingMember(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Modifier le membre d'équipe</h1>
        </div>
        <p className="page-subtitle">
          Modifier les informations de {teamMember.firstName} {teamMember.lastName}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-header">
            <h2 className="card-title">Informations personnelles</h2>
          </div>
          <div className="card-content">
            <div className="d-flex gap-lg">
              <div style={{ width: '200px', flexShrink: 0 }}>
                <OptionalImageUpload
                  onFileSelect={setPhoto1File}
                  label="Photo principale"
                  previewUrl={deletedPhoto1 ? null : teamMember.photoUrl1 || null}
                  allowDelete={true}
                  onDelete={handleDeletePhoto1}
                />
                <OptionalImageUpload
                  onFileSelect={setPhoto2File}
                  label="Photo secondaire"
                  description="Une photo supplémentaire (optionnel)"
                  previewUrl={deletedPhoto2 ? null : teamMember.photoUrl2 || null}
                  allowDelete={true}
                  onDelete={handleDeletePhoto2}
                />
              </div>

              <div style={{ flex: 1 }}>
                <div className="d-flex gap-md">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="firstName" className="form-label">Prénom</label>
                    <input
                      id="firstName"
                      type="text"
                      {...register('firstName')}
                      className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                    />
                    {errors.firstName && (
                      <p className="form-error">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="lastName" className="form-label">Nom</label>
                    <input
                      id="lastName"
                      type="text"
                      {...register('lastName')}
                      className={`form-input ${errors.lastName ? 'input-error' : ''}`}
                    />
                    {errors.lastName && (
                      <p className="form-error">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                
                <TranslationField
                  entityType="Team"
                  entityId={teamMember.id}
                  field="role"
                  label="Rôle / Poste"
                  errorMessage={errors.role?.message}
                >
                  <input
                    id="role"
                    type="text"
                    {...register('role')}
                    className={`form-input ${errors.role ? 'input-error' : ''}`}
                    placeholder="Ex: CEO, CTO, Designer..."
                  />
                </TranslationField>
                
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                  />
                  {errors.email && (
                    <p className="form-error">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-card">
          <div className="card-header">
            <h2 className="card-title">Description</h2>
          </div>
          <div className="card-content">
            <div className="form-group">
              <div className="d-flex align-items-center gap-md" style={{ marginBottom: '20px' }}>
                <span
                  className={!visible ? 'text-primary' : 'text-muted'}
                  style={{ fontWeight: !visible ? 'bold' : 'normal' }}
                >
                  Non affiché
                </span>
                <label
                  className="d-flex align-items-center"
                  style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px' }}
                >
                  <input
                    type="checkbox"
                    {...register('visible', {
                      onChange: async (e) => {
                        const newValue = e.target.checked
                        try {
                          const result = await updateTeamMemberVisible(teamMember.id, newValue)
                          if (result.success) {
                            success(newValue ? 'Membre affiché sur le site' : 'Membre masqué du site')
                          } else {
                            error(result.message || 'Erreur lors de la mise à jour')
                            setValue('visible', !newValue)
                          }
                        } catch {
                          error('Erreur réseau lors de la mise à jour de la visibilité')
                          setValue('visible', !newValue)
                        }
                      }
                    })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute', cursor: 'pointer',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: visible ? '#4f46e5' : '#ccc',
                      borderRadius: '34px', transition: '0.4s',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute', height: '22px', width: '22px',
                        left: '4px', bottom: '4px', backgroundColor: 'white',
                        borderRadius: '50%', transition: '0.4s',
                        transform: visible ? 'translateX(30px)' : 'translateX(0)',
                      }}
                    />
                  </span>
                </label>
                <span
                  className={visible ? 'text-primary' : 'text-muted'}
                  style={{ fontWeight: visible ? 'bold' : 'normal' }}
                >
                  Affiché
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="order" className="form-label">Ordre d'affichage</label>
              <input
                id="order"
                type="number"
                {...register('order', { valueAsNumber: true })}
                className={`form-input ${errors.order ? 'input-error' : ''}`}
                placeholder="Ordre d'affichage (optionnel)"
              />
              {errors.order && (
                <p className="form-error">{errors.order.message}</p>
              )}
            </div>
            
            <TranslationField
              entityType="Team"
              entityId={teamMember.id}
              field="intro"
              label="Introduction courte"
              errorMessage={errors.intro?.message}
            >
              <input
                id="intro"
                type="text"
                {...register('intro')}
                className={`form-input ${errors.intro ? 'input-error' : ''}`}
                placeholder="Une courte phrase qui apparaît sous le nom"
              />
            </TranslationField>
            
            <TranslationField
              entityType="Team"
              entityId={teamMember.id}
              field="description"
              label="Description complète"
              errorMessage={errors.description?.message}
            >
              <textarea
                id="description"
                {...register('description')}
                className={`form-textarea ${errors.description ? 'input-error' : ''}`}
                rows={5}
                placeholder="Bio ou description complète du membre"
              />
            </TranslationField>
          </div>
        </div>
        
        <div className="form-card">
          <div className="card-header">
            <h2 className="card-title">Liens sociaux</h2>
          </div>
          <div className="card-content">
            <div className="d-flex gap-md">
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="linkedinUrl" className="form-label">LinkedIn</label>
                <input
                  id="linkedinUrl"
                  type="text"
                  {...register('linkedinUrl')}
                  className={`form-input ${errors.linkedinUrl ? 'input-error' : ''}`}
                  placeholder="https://linkedin.com/in/..."
                />
                {errors.linkedinUrl && (
                  <p className="form-error">{errors.linkedinUrl.message}</p>
                )}
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="instagramUrl" className="form-label">Instagram</label>
                <input
                  id="instagramUrl"
                  type="text"
                  {...register('instagramUrl')}
                  className={`form-input ${errors.instagramUrl ? 'input-error' : ''}`}
                  placeholder="https://instagram.com/..."
                />
                {errors.instagramUrl && (
                  <p className="form-error">{errors.instagramUrl.message}</p>
                )}
              </div>
            </div>
            
            <div className="d-flex gap-md">
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="facebookUrl" className="form-label">Facebook</label>
                <input
                  id="facebookUrl"
                  type="text"
                  {...register('facebookUrl')}
                  className={`form-input ${errors.facebookUrl ? 'input-error' : ''}`}
                  placeholder="https://facebook.com/..."
                />
                {errors.facebookUrl && (
                  <p className="form-error">{errors.facebookUrl.message}</p>
                )}
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="twitterUrl" className="form-label">Twitter</label>
                <input
                  id="twitterUrl"
                  type="text"
                  {...register('twitterUrl')}
                  className={`form-input ${errors.twitterUrl ? 'input-error' : ''}`}
                  placeholder="https://twitter.com/..."
                />
                {errors.twitterUrl && (
                  <p className="form-error">{errors.twitterUrl.message}</p>
                )}
              </div>
            </div>
            
            <div className="d-flex gap-md">
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="githubUrl" className="form-label">GitHub</label>
                <input
                  id="githubUrl"
                  type="text"
                  {...register('githubUrl')}
                  className={`form-input ${errors.githubUrl ? 'input-error' : ''}`}
                  placeholder="https://github.com/..."
                />
                {errors.githubUrl && (
                  <p className="form-error">{errors.githubUrl.message}</p>
                )}
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="websiteUrl" className="form-label">Site web personnel</label>
                <input
                  id="websiteUrl"
                  type="text"
                  {...register('websiteUrl')}
                  className={`form-input ${errors.websiteUrl ? 'input-error' : ''}`}
                  placeholder="https://..."
                />
                {errors.websiteUrl && (
                  <p className="form-error">{errors.websiteUrl.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-actions d-flex justify-content-between">
          <DeleteActionButton
            onDelete={handleDeleteMember}
            isDeleting={isDeletingMember}
            disabled={isSubmitting}
            buttonSize="medium"
            itemName={`${teamMember.firstName} ${teamMember.lastName}`}
          />
          <div className="d-flex gap-md">
            <button
              type="button"
              onClick={handleCancel}
              className="secondary-button"
              disabled={isSubmitting || isDeletingMember}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-medium"
              disabled={isSubmitting || isDeletingMember}
            >
              {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
} 