'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Language } from '@prisma/client'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTranslation } from '@/lib/actions/translation-actions'

interface Field {
  name: string
  type: string
}

interface Model {
  name: string
  fields: Field[]
}

// Schéma de validation
const formSchema = z.object({
  entityType: z.string().min(1, 'Le type d\'entité est requis'),
  entityId: z.coerce.number().int().positive('L\'ID de l\'entité doit être un nombre positif'),
  field: z.string().min(1, 'Le champ est requis'),
  value: z.string().min(1, 'La valeur est requise'),
  languageId: z.coerce.number().int().positive('La langue est requise')
})

type FormValues = z.infer<typeof formSchema>

interface NewTranslationFormProps {
  languages: Language[]
  models: Model[]
}

export default function NewTranslationForm({ languages, models }: NewTranslationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [availableFields, setAvailableFields] = useState<Field[]>([])
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entityType: '',
      entityId: 0,
      field: '',
      value: '',
      languageId: 0
    }
  })
  
  // Surveiller le changement du type d'entité
  const watchEntityType = watch('entityType')
  
  // Mettre à jour les champs disponibles lorsque le modèle change
  useEffect(() => {
    if (watchEntityType) {
      const model = models.find(m => m.name === watchEntityType)
      if (model) {
        setSelectedModel(model.name)
        setAvailableFields(model.fields)
        // Réinitialiser le champ sélectionné
        setValue('field', '')
      } else {
        setAvailableFields([])
      }
    } else {
      setAvailableFields([])
    }
  }, [watchEntityType, models, setValue])
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      const result = await createTranslation(data)
      
      if (result.success) {
        toast.success('Traduction ajoutée avec succès')
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/landing/translations')
          router.refresh()
        }, 1000)
      } else {
        toast.error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      toast.error('Une erreur est survenue lors de l\'ajout de la traduction')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/landing/translations')
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Ajouter une traduction</h1>
        </div>
        <p className="page-subtitle">
          Créer une nouvelle entrée de traduction
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            <div className="form-group">
              <label htmlFor="entityType" className="form-label">Type d'entité</label>
              <select
                id="entityType"
                {...register('entityType')}
                className={`form-select ${errors.entityType ? 'input-error' : ''}`}
              >
                <option value="">Sélectionnez un type d'entité</option>
                {models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </select>
              {errors.entityType && (
                <p className="form-error">{errors.entityType.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="entityId" className="form-label">ID de l'entité</label>
              <input
                id="entityId"
                type="number"
                min="1"
                {...register('entityId')}
                className={`form-input ${errors.entityId ? 'input-error' : ''}`}
              />
              {errors.entityId && (
                <p className="form-error">{errors.entityId.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="field" className="form-label">Champ</label>
              <select
                id="field"
                {...register('field')}
                className={`form-select ${errors.field ? 'input-error' : ''}`}
                disabled={availableFields.length === 0}
              >
                <option value="">Sélectionnez un champ</option>
                {availableFields.map((field) => (
                  <option key={field.name} value={field.name}>
                    {field.name}
                  </option>
                ))}
              </select>
              {errors.field && (
                <p className="form-error">{errors.field.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="languageId" className="form-label">Langue</label>
              <select
                id="languageId"
                {...register('languageId')}
                className={`form-select ${errors.languageId ? 'input-error' : ''}`}
              >
                <option value="">Sélectionnez une langue</option>
                {languages.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.name} ({language.code})
                  </option>
                ))}
              </select>
              {errors.languageId && (
                <p className="form-error">{errors.languageId.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="value" className="form-label">Valeur traduite</label>
              <textarea
                id="value"
                {...register('value')}
                className={`form-textarea ${errors.value ? 'input-error' : ''}`}
                rows={4}
              ></textarea>
              {errors.value && (
                <p className="form-error">{errors.value.message}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleCancel}
            className="btn btn-secondary btn-medium"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="btn btn-primary btn-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Ajout en cours...' : 'Ajouter la traduction'}
          </button>
        </div>
      </form>
    </div>
  )
} 