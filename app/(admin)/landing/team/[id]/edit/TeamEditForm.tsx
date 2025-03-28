'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Team } from '@prisma/client'
import { updateTeamMember } from '@/lib/actions/team-actions'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Schéma de validation
const formSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').min(1, 'L\'email est requis'),
  role: z.string().min(1, 'Le rôle est requis'),
  intro: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  photoUrl1: z.string().url('URL d\'image invalide').nullable().optional(),
  photoUrl2: z.string().url('URL d\'image invalide').nullable().optional(),
  linkedinUrl: z.string().url('URL LinkedIn invalide').nullable().optional(),
  instagramUrl: z.string().url('URL Instagram invalide').nullable().optional(),
  facebookUrl: z.string().url('URL Facebook invalide').nullable().optional(),
  githubUrl: z.string().url('URL GitHub invalide').nullable().optional(),
  twitterUrl: z.string().url('URL Twitter invalide').nullable().optional(),
  websiteUrl: z.string().url('URL de site web invalide').nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface TeamEditFormProps {
  teamMember: Team
}

export default function TeamEditForm({ teamMember }: TeamEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: teamMember.firstName,
      lastName: teamMember.lastName,
      email: teamMember.email,
      role: teamMember.role,
      intro: teamMember.intro || null,
      description: teamMember.description || null,
      photoUrl1: teamMember.photoUrl1 || null,
      photoUrl2: teamMember.photoUrl2 || null,
      linkedinUrl: teamMember.linkedinUrl || null,
      instagramUrl: teamMember.instagramUrl || null,
      facebookUrl: teamMember.facebookUrl || null,
      githubUrl: teamMember.githubUrl || null,
      twitterUrl: teamMember.twitterUrl || null,
      websiteUrl: teamMember.websiteUrl || null,
    }
  })

  const photoUrl1 = watch('photoUrl1')
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Remplacer l'approche avec reduce par une assignation explicite
      const formattedData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        intro: data.intro === undefined ? null : data.intro,
        description: data.description === undefined ? null : data.description,
        photoUrl1: data.photoUrl1 === undefined ? null : data.photoUrl1,
        photoUrl2: data.photoUrl2 === undefined ? null : data.photoUrl2,
        linkedinUrl: data.linkedinUrl === undefined ? null : data.linkedinUrl,
        instagramUrl: data.instagramUrl === undefined ? null : data.instagramUrl,
        facebookUrl: data.facebookUrl === undefined ? null : data.facebookUrl,
        githubUrl: data.githubUrl === undefined ? null : data.githubUrl,
        twitterUrl: data.twitterUrl === undefined ? null : data.twitterUrl,
        websiteUrl: data.websiteUrl === undefined ? null : data.websiteUrl,
      }
      
      const result = await updateTeamMember(teamMember.id, formattedData)
      
      if (result.success) {
        toast.success('Membre d\'équipe mis à jour avec succès')
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/landing/team')
          router.refresh()
        }, 1000)
      } else {
        toast.error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      toast.error('Une erreur est survenue lors de la mise à jour')
      console.error(error)
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
              <div className="d-flex flex-column gap-md" style={{ width: '200px' }}>
                {photoUrl1 ? (
                  <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '8px', overflow: 'hidden' }}>
                    <Image
                      src={photoUrl1}
                      alt={`${teamMember.firstName} ${teamMember.lastName}`}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '200px', height: '200px', borderRadius: '8px', backgroundColor: '#e0e0e0', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '1.5rem' }}>
                    {teamMember.firstName.charAt(0)}{teamMember.lastName.charAt(0)}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="photoUrl1" className="form-label">URL de la photo principale</label>
                  <input
                    id="photoUrl1"
                    type="text"
                    {...register('photoUrl1')}
                    className={`form-input ${errors.photoUrl1 ? 'input-error' : ''}`}
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.photoUrl1 && (
                    <p className="form-error">{errors.photoUrl1.message}</p>
                  )}
                </div>
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
            className="btn btn-primary btn-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </form>
    </div>
  )
} 