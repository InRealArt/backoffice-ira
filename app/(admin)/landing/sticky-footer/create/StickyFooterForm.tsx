'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/Toast/ToastContext'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { createStickyFooter } from '@/lib/actions/sticky-footer-actions'
import InputField from '@/app/components/Forms/InputField'
import TextareaField from '@/app/components/Forms/TextareaField'
import TranslationField from '@/app/components/TranslationField'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Schéma de validation simplifié
const formSchema = z.object({
  activeOnAllPages: z.boolean(),
  activeOnSpecificPages: z.boolean(),
  specificPages: z.string().optional(),
  endValidityDate: z.string().optional(),
  title: z.string().optional(),
  text: z.string().optional(),
  textButton: z.string().optional(),
  buttonUrl: z.string().optional()
}).refine((data) => {
  // Si activeOnAllPages est coché, activeOnSpecificPages doit être décoché
  if (data.activeOnAllPages && data.activeOnSpecificPages) {
    return false
  }
  return true
}, {
  message: "Vous ne pouvez pas activer sur toutes les pages ET sur des pages spécifiques en même temps",
  path: ["activeOnAllPages"]
})

type FormValues = z.infer<typeof formSchema>

export default function StickyFooterForm() {
  const router = useRouter()
  const { success, error } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activeOnAllPages: false,
      activeOnSpecificPages: false,
      specificPages: '',
      endValidityDate: '',
      title: '',
      text: '',
      textButton: '',
      buttonUrl: ''
    }
  })
  
  const watchedValues = watch()
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Validation manuelle pour les règles métier
      const validationErrors: string[] = []
      
      // Si activeOnAllPages est coché, tous les champs sont obligatoires
      if (data.activeOnAllPages) {
        if (!data.title?.trim()) validationErrors.push('Le titre est obligatoire')
        if (!data.text?.trim()) validationErrors.push('Le texte est obligatoire')
        if (!data.textButton?.trim()) validationErrors.push('Le texte du bouton est obligatoire')
        if (!data.buttonUrl?.trim()) validationErrors.push('L\'URL du bouton est obligatoire')
        if (!data.endValidityDate) validationErrors.push('La date de fin de validité est obligatoire')
      }
      
      // Si activeOnSpecificPages est coché, tous les champs sont obligatoires
      if (data.activeOnSpecificPages) {
        if (!data.title?.trim()) validationErrors.push('Le titre est obligatoire')
        if (!data.text?.trim()) validationErrors.push('Le texte est obligatoire')
        if (!data.textButton?.trim()) validationErrors.push('Le texte du bouton est obligatoire')
        if (!data.buttonUrl?.trim()) validationErrors.push('L\'URL du bouton est obligatoire')
        if (!data.endValidityDate) validationErrors.push('La date de fin de validité est obligatoire')
        if (!data.specificPages?.trim()) validationErrors.push('Les pages spécifiques sont obligatoires')
      }
      
      // Validation des formats
      if (data.specificPages?.trim()) {
        const urls = data.specificPages.split(',').map(url => url.trim())
        const urlPattern = /^\/[a-zA-Z0-9\-_\/]*$/
        const invalidUrls = urls.filter(url => !urlPattern.test(url))
        if (invalidUrls.length > 0) {
          validationErrors.push('Les URLs des pages spécifiques doivent commencer par "/" et contenir uniquement des caractères alphanumériques, tirets et slashes')
        }
      }
      
      if (data.buttonUrl?.trim()) {
        const urlPattern = /^\/[a-zA-Z0-9\-_\/]*$/
        if (!urlPattern.test(data.buttonUrl)) {
          validationErrors.push('L\'URL du bouton doit commencer par "/" et contenir uniquement des caractères alphanumériques, tirets et slashes')
        }
      }
      
      if (data.endValidityDate) {
        const endDate = new Date(data.endValidityDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (endDate <= today) {
          validationErrors.push('La date de fin doit être supérieure à la date courante')
        }
      }
      
      if (validationErrors.length > 0) {
        error(`Erreurs de validation : • ${validationErrors.join(' • ')}`)
        setIsSubmitting(false)
        return
      }
      
      // Préparer les données pour l'API
      const apiData = {
        activeOnAllPages: data.activeOnAllPages,
        activeOnSpecificPages: data.activeOnSpecificPages,
        specificPages: data.specificPages ? 
          data.specificPages.split(',').map(url => url.trim()) : [],
        endValidityDate: data.endValidityDate ? 
          new Date(data.endValidityDate) : undefined,
        title: data.title || undefined,
        text: data.text || undefined,
        textButton: data.textButton || undefined,
        buttonUrl: data.buttonUrl || undefined
      }
      
      const result = await createStickyFooter(apiData)
      
      if (result.success && result.stickyFooter) {
        // Gérer les traductions pour les champs traduisibles
        const fieldsToTranslate: { [key: string]: string } = {}
        
        if (data.title?.trim()) {
          fieldsToTranslate.title = data.title.trim()
        }
        
        if (data.text?.trim()) {
          fieldsToTranslate.text = data.text.trim()
        }
        
        if (data.textButton?.trim()) {
          fieldsToTranslate.textButton = data.textButton.trim()
        }
        
        // Traiter les traductions si des champs sont présents
        if (Object.keys(fieldsToTranslate).length > 0) {
          await handleEntityTranslations('StickyFooter', result.stickyFooter.id, fieldsToTranslate)
        }
        
        success('Sticky footer créé avec succès')
        setTimeout(() => {
          router.push('/landing/sticky-footer')
          router.refresh()
        }, 1000)
      } else {
        error(result.message || 'Une erreur est survenue lors de la création')
      }
    } catch (error: any) {
      error('Une erreur est survenue lors de la création')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/landing/sticky-footer')
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Créer un Sticky Footer</h1>
        <p>Configurez les paramètres du sticky footer</p>
      </div>
      
      <div className="page-content">
        <form onSubmit={handleSubmit(onSubmit)} className="form">
          <div className="form-section">
            <h3>Activation</h3>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  {...register('activeOnAllPages')}
                  disabled={watchedValues.activeOnSpecificPages}
                />
                <span className="checkbox-text">Activer sur toutes les pages</span>
              </label>
              {errors.activeOnAllPages && (
                <span className="error-message">{errors.activeOnAllPages.message}</span>
              )}
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  {...register('activeOnSpecificPages')}
                  disabled={watchedValues.activeOnAllPages}
                />
                <span className="checkbox-text">Activer sur des pages spécifiques</span>
              </label>
              {errors.activeOnSpecificPages && (
                <span className="error-message">{errors.activeOnSpecificPages.message}</span>
              )}
            </div>
            
            {watchedValues.activeOnSpecificPages && (
              <div>
                <InputField
                  id="specificPages"
                  label="Pages spécifiques"
                  name="specificPages"
                  register={register}
                  error={errors.specificPages?.message}
                  placeholder="Ex: /accueil, /about, /contact"
                />
                <small className="form-help">
                  Séparez les URLs par des virgules. Format: /page1, /page2
                </small>
              </div>
            )}
            
            {(watchedValues.activeOnAllPages || watchedValues.activeOnSpecificPages) && (
              <div className="form-group" style={{ maxWidth: '300px' }}>
                <InputField
                  id="endValidityDate"
                  label="Date de fin de validité"
                  name="endValidityDate"
                  type="date"
                  register={register}
                  error={errors.endValidityDate?.message}
                />
              </div>
            )}
          </div>
          
          <div className="form-section">
            <h3>Contenu</h3>
            
            <TranslationField
              entityType="StickyFooter"
              entityId={null}
              field="title"
              label="Titre"
              required={watchedValues.activeOnAllPages || watchedValues.activeOnSpecificPages}
              errorMessage={errors.title?.message}
            >
              <input
                id="title"
                type="text"
                {...register('title')}
                className={`form-input ${errors.title ? 'input-error' : ''}`}
                placeholder="Titre du sticky footer"
              />
            </TranslationField>
            
            <TranslationField
              entityType="StickyFooter"
              entityId={null}
              field="text"
              label="Texte"
              required={watchedValues.activeOnAllPages || watchedValues.activeOnSpecificPages}
              errorMessage={errors.text?.message}
            >
              <textarea
                id="text"
                {...register('text')}
                className={`form-input ${errors.text ? 'input-error' : ''}`}
                rows={4}
                placeholder="Texte du sticky footer"
              />
            </TranslationField>
            
            <TranslationField
              entityType="StickyFooter"
              entityId={null}
              field="textButton"
              label="Texte du bouton"
              required={watchedValues.activeOnAllPages || watchedValues.activeOnSpecificPages}
              errorMessage={errors.textButton?.message}
            >
              <input
                id="textButton"
                type="text"
                {...register('textButton')}
                className={`form-input ${errors.textButton ? 'input-error' : ''}`}
                placeholder="Texte du bouton"
              />
            </TranslationField>
            
            <InputField
              id="buttonUrl"
              label="URL du bouton"
              name="buttonUrl"
              register={register}
              error={errors.buttonUrl?.message}
              required={watchedValues.activeOnAllPages || watchedValues.activeOnSpecificPages}
              placeholder="/page-destination"
            />
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoadingSpinner size="small" message="Enregistrement..." inline />
              ) : (
                'Créer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
