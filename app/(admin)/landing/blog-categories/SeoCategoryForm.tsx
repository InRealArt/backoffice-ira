'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/Toast/ToastContext'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { createSeoCategory, updateSeoCategory } from '@/lib/actions/seo-category-actions'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import TranslationField from '@/app/components/TranslationField'
import InputField from '@/app/components/Forms/InputField'
import TextareaField from '@/app/components/Forms/TextareaField'

interface SeoCategoryFormProps {
  category?: {
    id: number
    name: string
    url?: string | null
    color?: string | null
    shortDescription?: string | null
    longDescription?: string | null
    textCTA?: string | null
    linkCTA?: string | null
  }
  isEditing?: boolean
}

export default function SeoCategoryForm({ category, isEditing = false }: SeoCategoryFormProps) {
  const router = useRouter()
  const { success, error } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    color: '#000000',
    shortDescription: '',
    longDescription: '',
    textCTA: '',
    linkCTA: ''
  })
  
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        url: category.url || '',
        color: category.color || '#000000',
        shortDescription: category.shortDescription || '',
        longDescription: category.longDescription || '',
        textCTA: category.textCTA || '',
        linkCTA: category.linkCTA || ''
      })
    }
  }, [category])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      error('Le nom de la catégorie est obligatoire')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (isEditing && category) {
        const result = await updateSeoCategory(category.id, formData)
        
        if (result.success) {
          // Gestion des traductions
          try {
            await handleEntityTranslations('SeoCategory', category.id, {
              name: formData.name,
              shortDescription: formData.shortDescription,
              longDescription: formData.longDescription,
              textCTA: formData.textCTA
            })
          } catch (translationError) {
            console.error('Erreur lors de la gestion des traductions:', translationError)
            // On ne bloque pas la mise à jour de la catégorie en cas d'erreur de traduction
          }
          
          success('Catégorie mise à jour avec succès')
          router.push('/landing/blog-categories')
          router.refresh()
        } else {
          error(result.message || 'Une erreur est survenue lors de la mise à jour')
        }
      } else {
        const result = await createSeoCategory(formData)
        
        if (result.success) {
          // Si création réussie, on ajoute les traductions
          if (result.category && result.category.id) {
            try {
              await handleEntityTranslations('SeoCategory', result.category.id, {
                name: formData.name,
                shortDescription: formData.shortDescription,
                longDescription: formData.longDescription,
                textCTA: formData.textCTA
              })
            } catch (translationError) {
              console.error('Erreur lors de la gestion des traductions:', translationError)
            }
          }
          
          success('Catégorie créée avec succès')
          router.push('/landing/blog-categories')
          router.refresh()
        } else {
          error(result.message || 'Une erreur est survenue lors de la création')
        }
      }
    } catch (catchError) {
      console.error('Erreur lors de l\'enregistrement:', catchError)
      error('Une erreur est survenue lors de l\'enregistrement')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/landing/blog-categories')
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          {isEditing ? `Modifier la catégorie "${category?.name}"` : 'Nouvelle catégorie'}
        </h1>
        <p className="page-subtitle">
          {isEditing 
            ? 'Modifiez les informations de la catégorie' 
            : 'Créez une nouvelle catégorie pour organiser vos articles'
          }
        </p>
      </div>
      
      <div className="page-content">
        <form onSubmit={handleSubmit} className="form-container">
          <TranslationField
            entityType="SeoCategory"
            entityId={isEditing && category ? category.id : null}
            field="name"
            label="Nom"
            required={true}
          >
            <InputField
              id="name"
              name="name"
              label=""
              type="text"
              value={formData.name}
              onChange={handleChange}
              required={false}
              placeholder="Nom de la catégorie"
              error={!formData.name.trim() ? 'Le nom est obligatoire' : undefined}
            />
          </TranslationField>
          
          <InputField
            id="url"
            name="url"
            label="URL"
            type="text"
            value={formData.url}
            onChange={handleChange}
            placeholder="URL de la catégorie (optionnel)"
          />
          
          <div className="form-group">
            <label htmlFor="color" className="form-label">Couleur</label>
            <div className="d-flex align-items-center gap-md">
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="form-color-input"
              />
              <InputField
                id="colorText"
                name="color"
                label=""
                type="text"
                value={formData.color}
                onChange={handleChange}
                placeholder="#000000"
                className="flex-grow-1"
              />
            </div>
          </div>
          
          <TranslationField
            entityType="SeoCategory"
            entityId={isEditing && category ? category.id : null}
            field="shortDescription"
            label="Description courte"
          >
            <TextareaField
              id="shortDescription"
              name="shortDescription"
              label=""
              value={formData.shortDescription}
              onChange={handleChange}
              rows={2}
              placeholder="Description courte de la catégorie (optionnel)"
            />
          </TranslationField>
          
          <TranslationField
            entityType="SeoCategory"
            entityId={isEditing && category ? category.id : null}
            field="longDescription"
            label="Description longue"
          >
            <TextareaField
              id="longDescription"
              name="longDescription"
              label=""
              value={formData.longDescription}
              onChange={handleChange}
              rows={4}
              placeholder="Description détaillée de la catégorie (optionnel)"
            />
          </TranslationField>
          
          <TranslationField
            entityType="SeoCategory"
            entityId={isEditing && category ? category.id : null}
            field="textCTA"
            label="Texte du CTA"
          >
            <InputField
              id="textCTA"
              name="textCTA"
              label=""
              type="text"
              value={formData.textCTA}
              onChange={handleChange}
              placeholder="Texte du bouton d'appel à l'action (optionnel)"
            />
          </TranslationField>
          
          <InputField
            id="linkCTA"
            name="linkCTA"
            label="Lien du CTA"
            type="text"
            value={formData.linkCTA}
            onChange={handleChange}
            placeholder="URL de redirection du bouton CTA (optionnel)"
          />
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleCancel}
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
                isEditing ? 'Mettre à jour' : 'Créer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 