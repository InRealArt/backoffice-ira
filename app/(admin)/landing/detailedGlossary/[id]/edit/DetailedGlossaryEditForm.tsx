'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus, Trash, PenSquare } from 'lucide-react'
import { 
  updateDetailedGlossaryHeader, 
  createDetailedGlossaryItem, 
  deleteDetailedGlossaryItem 
} from '@/lib/actions/glossary-actions'
import { DetailedGlossaryHeader, DetailedGlossaryItem } from '@prisma/client'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import TranslationField from '@/app/components/TranslationField'
import TranslationIcon from '@/app/components/TranslationIcon'
// Interface pour les données incluant glossaryItems
interface DetailedGlossaryHeaderWithItems extends DetailedGlossaryHeader {
  glossaryItems: DetailedGlossaryItem[]
}

// Schéma de validation pour le formulaire d'édition du header
const headerFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis')
})

// Schéma de validation pour l'ajout d'items
const itemFormSchema = z.object({
  question: z.string().min(1, 'La question est requise'),
  answer: z.string().min(1, 'La réponse est requise')
})

type HeaderFormValues = z.infer<typeof headerFormSchema>
type ItemFormValues = z.infer<typeof itemFormSchema>

interface DetailedGlossaryEditFormProps {
  glossaryHeader: DetailedGlossaryHeaderWithItems
}

export default function DetailedGlossaryEditForm({ glossaryHeader }: DetailedGlossaryEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingItem, setIsDeletingItem] = useState<number | null>(null)
  const [isEditingHeader, setIsEditingHeader] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  
  // Formulaire pour l'édition du header
  const {
    register: registerHeader,
    handleSubmit: handleSubmitHeader,
    formState: { errors: headerErrors }
  } = useForm<HeaderFormValues>({
    resolver: zodResolver(headerFormSchema),
    defaultValues: {
      name: glossaryHeader.name
    }
  })
  
  // Formulaire pour l'ajout d'items
  const {
    register: registerItem,
    handleSubmit: handleSubmitItem,
    formState: { errors: itemErrors },
    reset: resetItemForm
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      question: '',
      answer: ''
    }
  })
  
  // Mise à jour du header
  const onSubmitHeader = async (data: HeaderFormValues) => {
    setIsSubmitting(true)
    
    try {
      const result = await updateDetailedGlossaryHeader(glossaryHeader.id, data.name)
      
      // Gestion des traductions pour le champ name
      try {
        await handleEntityTranslations('DetailedGlossaryHeader', glossaryHeader.id, {
          name: data.name
        })
      } catch (translationError) {
        console.error('Erreur lors de la gestion des traductions:', translationError)
        // On ne bloque pas la mise à jour en cas d'erreur de traduction
      }
      
      if (result.success) {
        toast.success('Section mise à jour avec succès')
        setIsEditingHeader(false)
        router.refresh()
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
  
  // Ajout d'un nouvel item
  const onSubmitItem = async (data: ItemFormValues) => {
    setIsSubmitting(true)
    
    try {
      const result = await createDetailedGlossaryItem({
        headerId: glossaryHeader.id,
        question: data.question,
        answer: data.answer
      })
      
      if (result.success) {
        toast.success('Question ajoutée avec succès')
        resetItemForm()
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      toast.error('Une erreur est survenue lors de l\'ajout')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Ajout rapide d'un item
  const handleAddItem = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return
    
    setIsSubmitting(true)
    
    try {
      const result = await createDetailedGlossaryItem({
        headerId: glossaryHeader.id,
        question: newQuestion,
        answer: newAnswer
      })
      
      if (result.success) {
        // Gestion des traductions pour les champs question et answer
        try {
          if (result.data && result.data.id) {
            await handleEntityTranslations('DetailedGlossaryItem', result.data.id, {
              question: newQuestion,
              answer: newAnswer
            })
          }
        } catch (translationError) {
          console.error('Erreur lors de la gestion des traductions:', translationError)
          // On ne bloque pas l'ajout en cas d'erreur de traduction
        }
        
        setNewQuestion('')
        setNewAnswer('')
        toast.success('Question ajoutée avec succès')
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      toast.error('Une erreur est survenue lors de l\'ajout')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Suppression d'un item
  const handleDeleteItem = async (itemId: number) => {
    setIsDeletingItem(itemId)
    
    try {
      const result = await deleteDetailedGlossaryItem(itemId)
      
      if (result.success) {
        toast.success('Question supprimée avec succès')
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      toast.error('Une erreur est survenue lors de la suppression')
      console.error(error)
    } finally {
      setIsDeletingItem(null)
    }
  }
  
  // Annulation de l'édition
  const handleCancel = () => {
    router.push('/landing/detailedGlossary')
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">
            Éditer la section de Glossaire : {glossaryHeader.name}
          </h1>
        </div>
        <p className="page-subtitle">
          Modifiez les informations de cette section et gérez ses questions
        </p>
      </div>
      
      <div className="form-container">
        <div className="form-card">
          <div className="card-content">
            <div className="section-header d-flex justify-content-between align-items-center">
              <h2 className="section-title">Informations de la section</h2>
              <button 
                type="button" 
                onClick={() => setIsEditingHeader(!isEditingHeader)}
                className="btn btn-secondary btn-small"
              >
                {isEditingHeader ? 'Annuler' : 'Modifier'}
              </button>
            </div>
            
            {isEditingHeader ? (
              <form onSubmit={handleSubmitHeader(onSubmitHeader)} className="mt-md">
                <TranslationField
                  entityType="DetailedGlossaryHeader"
                  entityId={glossaryHeader.id}
                  field="name"
                  label="Nom de la section"
                  errorMessage={headerErrors.name?.message}
                >
                  <input
                    id="name"
                    type="text"
                    {...registerHeader('name')}
                    className={`form-input ${headerErrors.name ? 'input-error' : ''}`}
                    placeholder="Nom de la section"
                  />
                </TranslationField>
                
                <div className="d-flex gap-md mt-md">
                  <button
                    type="button"
                    onClick={() => setIsEditingHeader(false)}
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
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="info-display mt-md">
                <div className="info-item">
                  <span className="info-label"><b>Nom de la section : </b></span>
                  <span className="info-value">
                    {glossaryHeader.name}
                    <TranslationIcon 
                      entityType="DetailedGlossaryHeader" 
                      entityId={glossaryHeader.id} 
                      field="name" 
                      languageCode="en"
                      className="ml-sm"
                    />
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label"><b>Nombre de questions : </b></span>
                  <span className="info-value">{glossaryHeader.glossaryItems.length}</span>
                </div>
              </div>
            )}
            
            <hr className="form-divider" />
            
            <div className="section-header mt-lg d-flex justify-content-between align-items-center">
              <h2 className="section-title">Ajouter une question</h2>
              <div className="section-badge" style={{ 
                backgroundColor: '#e0e7ff', 
                color: '#4f46e5', 
                padding: '4px 12px', 
                borderRadius: '16px', 
                fontSize: '0.85rem', 
                fontWeight: '500' 
              }}>
                {glossaryHeader.glossaryItems.length} question(s)
              </div>
            </div>
            
            <div className="form-card add-question-card" style={{ 
              backgroundColor: '#f9fafb', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '16px', 
              marginTop: '16px' 
            }}>
              <TranslationField
                entityType="DetailedGlossaryItem"
                entityId={null}
                field="question"
                label={<div className="d-flex align-items-center">
                  <span style={{ color: '#6366f1', marginRight: '8px' }}>Q:</span>
                  Question
                </div>}
                className="mt-sm"
              >
                <input
                  id="question"
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="form-input"
                  placeholder="Ex: Comment acheter un NFT?"
                  style={{ borderColor: '#d1d5db' }}
                />
              </TranslationField>
              
              <TranslationField
                entityType="DetailedGlossaryItem"
                entityId={null}
                field="answer"
                label={<div className="d-flex align-items-center">
                  <span style={{ color: '#6366f1', marginRight: '8px' }}>R:</span>
                  Réponse
                </div>}
                className="mt-md"
              >
                <textarea
                  id="answer"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="form-textarea"
                  rows={4}
                  placeholder="Réponse détaillée à la question..."
                  style={{ borderColor: '#d1d5db' }}
                />
              </TranslationField>
              
              <div className="d-flex justify-content-end mt-md">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!newQuestion.trim() || !newAnswer.trim() || isSubmitting}
                  className="btn btn-primary btn-medium"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: (!newQuestion.trim() || !newAnswer.trim() || isSubmitting) ? '#9ca3af' : '#4f46e5'
                  }}
                >
                  <Plus size={16} />
                  Ajouter cette question
                </button>
              </div>
            </div>
            
            <hr className="form-divider" />
            
            <div className="section-header mt-lg">
              <h2 className="section-title">Questions de cette section</h2>
            </div>
            
            {glossaryHeader.glossaryItems.length === 0 ? (
              <div className="empty-state mt-md">
                <p className="text-muted">Aucune question n'a encore été ajoutée à cette section</p>
                <p className="text-muted text-sm">Utilisez le formulaire ci-dessus pour ajouter des questions</p>
              </div>
            ) : (
              <div className="faq-items-list mt-md">
                {glossaryHeader.glossaryItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="faq-item-card"
                    style={{
                      backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div className="faq-item-header d-flex justify-content-between align-items-center">
                      <h4 style={{ 
                        fontWeight: '600', 
                        marginBottom: '8px',
                        color: '#111827'
                      }}>
                        <span style={{ marginRight: '8px', color: '#6366f1' }}>{index + 1}.</span>
                        {item.question}
                        <TranslationIcon
                          entityType="DetailedGlossaryItem" 
                          entityId={item.id} 
                          field="question" 
                          languageCode="en"
                          className="ml-sm"
                        />
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="btn btn-icon"
                        aria-label="Supprimer cette question"
                        disabled={isDeletingItem === item.id}
                        style={{
                          padding: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#fee2e2',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {isDeletingItem === item.id ? (
                          <span className="loading-spinner-small" />
                        ) : (
                          <Trash size={16} color="#ef4444" />
                        )}
                      </button>
                    </div>
                    <div 
                      className="faq-item-answer"
                      style={{
                        backgroundColor: '#ffffff',
                        padding: index % 2 === 0 ? '12px' : '0',
                        borderRadius: '6px',
                        color: '#4b5563',
                        lineHeight: '1.5',
                        marginTop: '4px',
                        whiteSpace: 'pre-line',
                        position: 'relative'
                      }}
                    >
                      {item.answer}
                      <div style={{ position: 'absolute', top: '4px', right: '4px' }}>
                        <TranslationIcon 
                          entityType="DetailedGlossaryItem" 
                          entityId={item.id} 
                          field="answer" 
                          languageCode="en"
                          className="ml-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="card-footer">
            <div className="d-flex justify-content-between">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary btn-medium"
              >
                Retour à la liste
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 