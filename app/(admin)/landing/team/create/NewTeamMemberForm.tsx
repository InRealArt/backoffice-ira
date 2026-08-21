'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTeamMember, updateTeamMember } from '@/lib/actions/team-actions'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import { useToast } from '@/app/components/Toast/ToastContext'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import OptionalImageUpload from '@/app/components/art/OptionalImageUpload'

// Schéma de validation
const formSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').min(1, 'L\'email est requis'),
  role: z.string().min(1, 'Le rôle est requis'),
  visible: z.boolean(),
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

export default function NewTeamMemberForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photo1File, setPhoto1File] = useState<File | null>(null)
  const [photo2File, setPhoto2File] = useState<File | null>(null)
  const { success, error } = useToast()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      visible: true,
      intro: null,
      description: null,
      linkedinUrl: null,
      instagramUrl: null,
      facebookUrl: null,
      githubUrl: null,
      twitterUrl: null,
      websiteUrl: null,
    }
  })

  const visible = watch('visible')

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    try {
      // Modifier cette partie pour corriger les erreurs de typage
      const formattedData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        visible: data.visible,
        order: 0,
        intro: data.intro === undefined ? null : data.intro,
        description: data.description === undefined ? null : data.description,
        photoUrl1: null,
        photoUrl2: null,
        linkedinUrl: data.linkedinUrl === undefined ? null : data.linkedinUrl,
        instagramUrl: data.instagramUrl === undefined ? null : data.instagramUrl,
        facebookUrl: data.facebookUrl === undefined ? null : data.facebookUrl,
        githubUrl: data.githubUrl === undefined ? null : data.githubUrl,
        twitterUrl: data.twitterUrl === undefined ? null : data.twitterUrl,
        websiteUrl: data.websiteUrl === undefined ? null : data.websiteUrl,
      }

      // Le membre doit d'abord exister en DB : son id sert de clé unique pour
      // le chemin de stockage R2 des photos (team/{id}-photoSlot.webp), afin
      // d'éviter toute collision entre homonymes.
      const result = await createTeamMember(formattedData)

      if (result.success && result.id) {
        if (photo1File || photo2File) {
          const { uploadTeamMemberImage } = await import('@/lib/r2/storage')

          const [photoUrl1, photoUrl2] = await Promise.all([
            photo1File
              ? uploadTeamMemberImage(photo1File, { memberId: result.id, photoSlot: 'photo1' })
              : Promise.resolve(null),
            photo2File
              ? uploadTeamMemberImage(photo2File, { memberId: result.id, photoSlot: 'photo2' })
              : Promise.resolve(null),
          ])

          await updateTeamMember(result.id, {
            ...formattedData,
            photoUrl1,
            photoUrl2,
          })
        }

        success('Membre d\'équipe créé avec succès')

        // Gestion des traductions pour le rôle et la description
        try {
          // Utiliser la fonction générique pour gérer les traductions
          await handleEntityTranslations('Team', result.id, {
            role: data.role || null,
            description: data.description || null
          })
        } catch (translationError) {
          console.error('Erreur lors de la gestion des traductions:', translationError)
          // On ne bloque pas la création du membre en cas d'erreur de traduction
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
      error('Une erreur est survenue lors de la création')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/landing/team')
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Ajouter un membre d'équipe</h1>
        </div>
        <p className="page-subtitle">
          Créer un nouveau profil de membre d'équipe
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
                />
                <OptionalImageUpload
                  onFileSelect={setPhoto2File}
                  label="Photo secondaire"
                  description="Une photo supplémentaire (optionnel)"
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
                
                <div className="form-group">
                  <label htmlFor="role" className="form-label">Rôle / Poste</label>
                  <input
                    id="role"
                    type="text"
                    {...register('role')}
                    className={`form-input ${errors.role ? 'input-error' : ''}`}
                    placeholder="Ex: CEO, CTO, Designer..."
                  />
                  {errors.role && (
                    <p className="form-error">{errors.role.message}</p>
                  )}
                </div>
                
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
                    {...register('visible')}
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
              <label htmlFor="intro" className="form-label">Introduction courte</label>
              <input
                id="intro"
                type="text"
                {...register('intro')}
                className={`form-input ${errors.intro ? 'input-error' : ''}`}
                placeholder="Une courte phrase qui apparaît sous le nom"
              />
              {errors.intro && (
                <p className="form-error">{errors.intro.message}</p>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="description" className="form-label">Description complète</label>
              <textarea
                id="description"
                {...register('description')}
                className={`form-textarea ${errors.description ? 'input-error' : ''}`}
                rows={5}
                placeholder="Bio ou description complète du membre"
              />
              {errors.description && (
                <p className="form-error">{errors.description.message}</p>
              )}
            </div>
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
        
        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="secondary-button"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-small"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Création...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  )
} 