'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Faq } from '@prisma/client'
import { createFaq, updateFaq } from '@/lib/actions/faq-actions'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import TranslationField from '@/app/components/TranslationField'

interface FaqFormProps {
  mode: 'create' | 'edit'
  faq?: Faq
}

export default function FaqForm({ mode, faq }: FaqFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFormDisabled, setIsFormDisabled] = useState(false)
  
  const [formData, setFormData] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    order: faq?.order || null,
  })
  
  const [errors, setErrors] = useState({
    question: '',
    answer: '',
    order: '',
  })
  
  const validateForm = () => {
    const newErrors = {
      question: '',
      answer: '',
      order: '',
    }
    
    if (!formData.question.trim()) {
      newErrors.question = 'La question est obligatoire'
    }
    
    if (!formData.answer.trim()) {
      newErrors.answer = 'La réponse est obligatoire'
    }
    
    setErrors(newErrors)
    
    return !Object.values(newErrors).some(error => error !== '')
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name === 'order') {
      const orderValue = value === '' ? null : parseInt(value, 10)
      setFormData(prev => ({ ...prev, [name]: orderValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    
    // Effacer l'erreur lors de la saisie
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsFormDisabled(true)
    
    startTransition(async () => {
      try {
        if (mode === 'create') {
          const result = await createFaq(formData)
          
          if (result.success) {
            toast.success('FAQ créée avec succès')
            
            // Gestion des traductions pour les champs question et answer
            try {
              if (result.faq && result.faq.id) {
                await handleEntityTranslations('Faq', result.faq.id, {
                  question: formData.question,
                  answer: formData.answer
                })
              }
            } catch (translationError) {
              console.error('Erreur lors de la gestion des traductions:', translationError)
              // On ne bloque pas la création en cas d'erreur de traduction
            }
            
            router.push('/landing/faq')
          } else {
            toast.error(result.message || 'Une erreur est survenue lors de la création')
            setIsFormDisabled(false)
          }
        } else if (mode === 'edit' && faq) {
          const result = await updateFaq(faq.id, formData)
          
          if (result.success) {
            toast.success('FAQ mise à jour avec succès')
            
            // Gestion des traductions pour les champs question et answer
            try {
              await handleEntityTranslations('Faq', faq.id, {
                question: formData.question,
                answer: formData.answer
              })
            } catch (translationError) {
              console.error('Erreur lors de la gestion des traductions:', translationError)
              // On ne bloque pas la mise à jour en cas d'erreur de traduction
            }
            
            router.push('/landing/faq')
          } else {
            toast.error(result.message || 'Une erreur est survenue lors de la mise à jour')
            setIsFormDisabled(false)
          }
        }
      } catch (error) {
        console.error('Erreur lors de la soumission du formulaire:', error)
        toast.error('Une erreur est survenue')
        setIsFormDisabled(false)
      }
    })
  }
  
  const handleCancel = () => {
    router.push('/landing/faq')
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">
            {mode === 'create' ? 'Nouvelle FAQ' : 'Modifier la FAQ'}
          </h1>
        </div>
        <p className="page-subtitle">
          {mode === 'create' 
            ? 'Ajouter une nouvelle question fréquemment posée' 
            : 'Modifier une question fréquemment posée'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-card">
          <div className="card-content">
            <TranslationField
              entityType="Faq"
              entityId={mode === 'edit' ? faq?.id || null : null}
              field="question"
              label={<>Question <span className="text-danger">*</span></>}
              errorMessage={errors.question}
            >
              <input
                id="question"
                name="question"
                type="text"
                value={formData.question}
                onChange={handleInputChange}
                className={`form-input ${errors.question ? 'input-error' : ''}`}
                disabled={isFormDisabled}
                placeholder="Saisissez la question"
              />
            </TranslationField>
            
            <TranslationField
              entityType="Faq"
              entityId={mode === 'edit' ? faq?.id || null : null}
              field="answer"
              label={<>Réponse <span className="text-danger">*</span></>}
              errorMessage={errors.answer}
              className="mt-4"
            >
              <textarea
                id="answer"
                name="answer"
                value={formData.answer}
                onChange={handleInputChange}
                className={`form-textarea ${errors.answer ? 'input-error' : ''}`}
                disabled={isFormDisabled}
                rows={5}
                placeholder="Saisissez la réponse"
              />
              <p className="form-help">
                Vous pouvez utiliser du texte enrichi pour la mise en forme de la réponse.
              </p>
            </TranslationField>
            
            <div className="form-group mt-4">
              <label htmlFor="order" className="form-label">
                Ordre
              </label>
              <input
                id="order"
                name="order"
                type="number"
                value={formData.order === null ? '' : formData.order}
                onChange={handleInputChange}
                className={`form-input ${errors.order ? 'input-error' : ''}`}
                disabled={isFormDisabled}
                placeholder="Ordre d'affichage"
              />
              {errors.order && (
                <p className="form-error">{errors.order}</p>
              )}
              <p className="form-help">
                L'ordre détermine la position d'affichage de cette FAQ.
              </p>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary btn-medium"
            onClick={handleCancel}
            disabled={isFormDisabled}
          >
            Annuler
          </button>
          
          <button
            type="submit"
            className="btn btn-primary btn-medium"
            disabled={isFormDisabled}
          >
            {isPending ? (
              <div className="btn-loading-container">
                <span className="spinner small light"></span>
                <span className="btn-loading-text">
                  {mode === 'create' ? 'Création en cours...' : 'Mise à jour en cours...'}
                </span>
              </div>
            ) : mode === 'create' ? (
              'Créer la FAQ'
            ) : (
              'Mettre à jour la FAQ'
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 