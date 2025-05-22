'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Language, Translation } from '@prisma/client'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateTranslation } from '@/lib/actions/translation-actions'
import SelectField from '@/app/components/Forms/SelectField'
import InputField from '@/app/components/Forms/InputField'
import TextareaField from '@/app/components/Forms/TextareaField'

interface Field {
  name: string
  type: string
}

interface Model {
  name: string
  fields: Field[]
}

interface TranslationWithLanguage extends Translation {
  language: Language
}

// Schéma de validation
const formSchema = z.object({
  entityType: z.string().min(1, 'Le type d\'entité est requis'),
  entityId: z.coerce.number().int().positive('L\'ID de l\'entité doit être un nombre positif'),
  field: z.string().min(1, 'Le champ est requis'),
  value: z.string(),
  languageId: z.coerce.number().int().positive('La langue est requise')
})

type FormValues = z.infer<typeof formSchema>

interface TranslationEditFormProps {
  translation: TranslationWithLanguage
  languages: Language[]
  models: Model[]
}

export default function TranslationEditForm({ translation, languages, models }: TranslationEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      entityType: translation.entityType,
      entityId: translation.entityId,
      field: translation.field,
      value: translation.value ?? '',
      languageId: translation.languageId
    }
  })
  
  // Surveiller le changement du type d'entité
  const watchEntityType = watch('entityType')
  
  // Mettre à jour les champs disponibles lorsque le modèle change
  useEffect(() => {
    if (watchEntityType) {
      const model = models.find(m => m.name === watchEntityType)
      if (model) {
        setAvailableFields(model.fields)
        
        // Réinitialiser le champ si le champ actuel n'est pas disponible dans le nouveau modèle
        const currentField = watch('field')
        const fieldExists = model.fields.some(f => f.name === currentField)
        
        if (!fieldExists) {
          setValue('field', '')
        }
      } else {
        setAvailableFields([])
        setValue('field', '')
      }
    } else {
      setAvailableFields([])
      setValue('field', '')
    }
  }, [watchEntityType, models, setValue, watch])
  
  // Initialiser les champs disponibles au chargement du composant
  useEffect(() => {
    const model = models.find(m => m.name === translation.entityType)
    if (model) {
      setAvailableFields(model.fields)
    }
  }, [translation.entityType, models])
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // S'assurer que le champ existe bien dans les champs disponibles
      const model = models.find(m => m.name === data.entityType)
      const isFieldValid = model?.fields.some(f => f.name === data.field)
      
      if (!isFieldValid) {
        toast.error('Le champ sélectionné n\'est pas valide pour ce type d\'entité')
        setIsSubmitting(false)
        return
      }
      
      // Afficher les données avant envoi pour débogage
      console.log('Données à envoyer:', data)
      
      const result = await updateTranslation(translation.id, data)
      
      if (result.success) {
        toast.success('Traduction mise à jour avec succès')
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/landing/translations')
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
    router.push('/landing/translations')
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Modifier la traduction</h1>
        </div>
        <p className="page-subtitle">
          Modifier les informations de la traduction
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            <SelectField 
              id="entityType"
              name="entityType"
              label="Type d'entité"
              value={watch('entityType')}
              onChange={(e) => setValue('entityType', e.target.value, { shouldValidate: true })}
              options={models.map(model => ({ value: model.name, label: model.name }))}
              error={errors.entityType?.message}
              placeholder="Sélectionnez un type d'entité"
            />

            <InputField
              id="entityId"
              name="entityId"
              label="ID de l'entité"
              type="number"
              min="1"
              register={register}
              error={errors.entityId?.message}
            />

            <SelectField 
              id="field"
              name="field"
              label="Champ"
              value={watch('field')}
              onChange={(e) => setValue('field', e.target.value, { shouldValidate: true })}
              options={availableFields.map(field => ({ value: field.name, label: field.name }))}
              error={errors.field?.message}
              disabled={availableFields.length === 0}
              placeholder="Sélectionnez un champ"
            />

            <SelectField 
              id="languageId"
              name="languageId"
              label="Langue"
              value={watch('languageId')}
              onChange={(e) => setValue('languageId', Number(e.target.value), { shouldValidate: true })}
              options={languages.map(language => ({ 
                value: language.id, 
                label: `${language.name} (${language.code})` 
              }))}
              error={errors.languageId?.message}
              placeholder="Sélectionnez une langue"
            />

            <TextareaField
              id="value"
              name="value"
              label="Valeur traduite"
              register={register}
              error={errors.value?.message}
              rows={4}
            />
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
            {isSubmitting ? 'Mise à jour en cours...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  )
} 