'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus, Trash, PenSquare, Save, XCircle } from 'lucide-react'
import { 
  createDetailedFaqPageItem,
  updateDetailedFaqPageItem,
  deleteDetailedFaqPageItem,
  getMaxOrderForPage
} from '@/lib/actions/faq-page-actions'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import { DetailedFaqPage, DetailedFaqPageItem } from '@prisma/client'
import TranslationField from '@/app/components/TranslationField'
import TranslationIcon from '@/app/components/TranslationIcon'

// Interface pour les données incluant faqItems
interface DetailedFaqPageWithItems extends DetailedFaqPage {
  faqItems: DetailedFaqPageItem[]
}

// Schéma de validation pour les questions/réponses
const itemFormSchema = z.object({
  question: z.string().min(1, 'La question est requise'),
  answer: z.string().min(1, 'La réponse est requise'),
  order: z.number().int().positive('L\'ordre doit être un nombre positif')
})

type ItemFormValues = z.infer<typeof itemFormSchema>

interface DetailedFaqPageEditFormProps {
  faqPage: DetailedFaqPageWithItems
}

// Fonction utilitaire pour formater le nom de la page
const formatPageName = (pageName: string) => {
  if (pageName.startsWith('/')) {
    return pageName === '/' ? 'Page d\'accueil' : pageName
  }
  return pageName
}

export default function DetailedFaqPageEditForm({ faqPage }: DetailedFaqPageEditFormProps) {
  const router = useRouter()
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isSubmittingItem, setIsSubmittingItem] = useState(false)
  const [isDeletingItem, setIsDeletingItem] = useState<number | null>(null)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [isUpdatingItem, setIsUpdatingItem] = useState(false)
  const [nextOrder, setNextOrder] = useState<number>(1)

  // Récupérer le prochain ordre disponible
  useEffect(() => {
    const loadNextOrder = async () => {
      try {
        const order = await getMaxOrderForPage(faqPage.id)
        setNextOrder(order)
      } catch (error) {
        console.error('Erreur lors du chargement de l\'ordre:', error)
      }
    }
    
    loadNextOrder()
  }, [faqPage.id])

  // Formulaire pour l'ajout de nouvelles questions
  const {
    register: registerItem,
    handleSubmit: handleSubmitItem,
    reset: resetItem,
    formState: { errors: itemErrors },
    setValue: setItemValue
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      question: '',
      answer: '',
      order: nextOrder
    }
  })

  // Mettre à jour la valeur par défaut de l'ordre quand nextOrder change
  useEffect(() => {
    setItemValue('order', nextOrder)
  }, [nextOrder, setItemValue])

  // Formulaire pour l'édition des questions existantes
  const {
    register: registerEditItem,
    handleSubmit: handleSubmitEditItem,
    reset: resetEditItem,
    formState: { errors: editItemErrors },
    setValue: setEditItemValue
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      question: '',
      answer: '',
      order: 1
    }
  })

  // Charger les données de l'item à éditer
  const startEditing = (item: DetailedFaqPageItem) => {
    setEditingItemId(item.id)
    setEditItemValue('question', item.question)
    setEditItemValue('answer', item.answer)
    setEditItemValue('order', item.order)
  }

  const cancelEditing = () => {
    setEditingItemId(null)
    resetEditItem()
  }

  // Gestion de l'ajout d'une nouvelle question
  const onAddItem = async (data: ItemFormValues) => {
    setIsSubmittingItem(true)
    
    try {
      const result = await createDetailedFaqPageItem({
        pageId: faqPage.id,
        question: data.question,
        answer: data.answer,
        order: data.order
      })
      
      if (result.success && result.data) {
        // Gestion des traductions pour les champs question et answer
        try {
          await handleEntityTranslations('DetailedFaqPageItem', result.data.id, {
            question: data.question,
            answer: data.answer
          })
        } catch (translationError) {
          console.error('Erreur lors de la gestion des traductions:', translationError)
          // On ne bloque pas la création en cas d'erreur de traduction
        }
        
        toast.success('Question ajoutée avec succès')
        resetItem()
        setIsAddingItem(false)
        
        // Mettre à jour l'ordre pour la prochaine question
        setNextOrder(await getMaxOrderForPage(faqPage.id))
        
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue')
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la question:', error)
      toast.error('Une erreur est survenue lors de l\'ajout de la question')
    } finally {
      setIsSubmittingItem(false)
    }
  }

  // Mise à jour d'une question existante
  const onUpdateItem = async (data: ItemFormValues) => {
    if (!editingItemId) return
    
    setIsUpdatingItem(true)
    
    try {
      const result = await updateDetailedFaqPageItem(editingItemId, {
        question: data.question,
        answer: data.answer,
        order: data.order
      })
      
      if (result.success) {
        // Gestion des traductions pour les champs question et answer
        try {
          await handleEntityTranslations('DetailedFaqPageItem', editingItemId, {
            question: data.question,
            answer: data.answer
          })
        } catch (translationError) {
          console.error('Erreur lors de la gestion des traductions:', translationError)
        }
        
        toast.success('Question mise à jour avec succès')
        setEditingItemId(null)
        resetEditItem()
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la question:', error)
      toast.error('Une erreur est survenue lors de la mise à jour')
    } finally {
      setIsUpdatingItem(false)
    }
  }

  // Suppression d'une question
  const handleDeleteItem = async (itemId: number) => {
    setIsDeletingItem(itemId)
    
    try {
      const result = await deleteDetailedFaqPageItem(itemId)
      
      if (result.success) {
        toast.success('Question supprimée avec succès')
        
        // Si nous supprimons l'item en cours d'édition, annuler l'édition
        if (editingItemId === itemId) {
          setEditingItemId(null)
          resetEditItem()
        }
        
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la question:', error)
      toast.error('Une erreur est survenue lors de la suppression')
    } finally {
      setIsDeletingItem(null)
    }
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">
            Éditer la FAQ de la page : {formatPageName(faqPage.name.toString())}
          </h1>
        </div>
        <p className="page-subtitle">
          Gérez les questions pour cette page spécifique
        </p>
      </div>
      
      <div className="form-container">
        <div className="form-card">
          <div className="card-content">
            <div className="section-header d-flex justify-content-between align-items-center">
              <h2 className="section-title">Informations de la page</h2>
            </div>
            
            <div className="info-display mt-md">
              <div className="info-item">
                <span className="info-label"><b>Page : </b></span>
                <span className="info-value">
                  {formatPageName(faqPage.name.toString())}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label"><b>Nombre de questions : </b></span>
                <span className="info-value">{faqPage.faqItems.length}</span>
              </div>
            </div>
            
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
                {faqPage.faqItems.length} question(s)
              </div>
            </div>
            
            {isAddingItem ? (
              <form onSubmit={handleSubmitItem(onAddItem)} className="add-item-form mt-md">
                <div className="form-header d-flex justify-content-between align-items-center">
                  <h3 className="form-subtitle">Nouvelle question</h3>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAddingItem(false)
                      resetItem()
                    }}
                    className="btn btn-icon"
                    disabled={isSubmittingItem}
                    aria-label="Annuler l'ajout"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="form-group">
                  <label htmlFor="question" className="form-label">Question</label>
                  <input 
                    id="question"
                    type="text"
                    {...registerItem('question')}
                    className={`form-input ${itemErrors.question ? 'input-error' : ''}`}
                    placeholder="Ex: Comment fonctionne cette fonctionnalité ?"
                    disabled={isSubmittingItem}
                  />
                  {itemErrors.question && (
                    <p className="form-error">{itemErrors.question.message}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="answer" className="form-label">Réponse</label>
                  <textarea 
                    id="answer"
                    {...registerItem('answer')}
                    className={`form-textarea ${itemErrors.answer ? 'input-error' : ''}`}
                    placeholder="Écrivez votre réponse détaillée ici..."
                    rows={5}
                    disabled={isSubmittingItem}
                  />
                  {itemErrors.answer && (
                    <p className="form-error">{itemErrors.answer.message}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="order" className="form-label">Ordre d'affichage</label>
                  <input 
                    id="order"
                    type="number"
                    min="1"
                    step="1"
                    {...registerItem('order', { valueAsNumber: true })}
                    className={`form-input ${itemErrors.order ? 'input-error' : ''}`}
                    disabled={isSubmittingItem}
                  />
                  {itemErrors.order && (
                    <p className="form-error">{itemErrors.order.message}</p>
                  )}
                  <p className="form-help">L'ordre détermine la position de la question dans la liste</p>
                </div>
                
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary btn-medium"
                    disabled={isSubmittingItem}
                  >
                    {isSubmittingItem ? 'Ajout en cours...' : 'Ajouter la question'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="add-item-trigger mt-md">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(true)}
                  className="btn btn-outline-primary btn-medium d-flex align-items-center gap-sm"
                >
                  <Plus size={16} />
                  <span>Ajouter une nouvelle question</span>
                </button>
              </div>
            )}
            
            <hr className="form-divider mt-lg" />
            
            <div className="section-header mt-lg">
              <h2 className="section-title">Questions existantes</h2>
            </div>
            
            <div className="faq-items-list mt-md">
              {faqPage.faqItems.length === 0 ? (
                <div className="empty-state">
                  <p>Aucune question dans cette section</p>
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(true)}
                    className="btn btn-primary btn-medium mt-md"
                  >
                    Ajouter une question
                  </button>
                </div>
              ) : (
                faqPage.faqItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="faq-item"
                    style={{
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px'
                    }}
                  >
                    {editingItemId === item.id ? (
                      <form onSubmit={handleSubmitEditItem(onUpdateItem)} className="edit-item-form">
                        <div className="form-header d-flex justify-content-between align-items-center">
                          <h3 className="form-subtitle">Modifier la question</h3>
                          <div className="form-header-actions">
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="btn btn-icon"
                              disabled={isUpdatingItem}
                              aria-label="Annuler l'édition"
                              style={{ marginRight: '8px' }}
                            >
                              <XCircle size={20} color="#ef4444" />
                            </button>
                            <button
                              type="submit"
                              className="btn btn-icon"
                              disabled={isUpdatingItem}
                              aria-label="Enregistrer les modifications"
                            >
                              {isUpdatingItem ? (
                                <span className="loading-spinner-small" />
                              ) : (
                                <Save size={20} color="#22c55e" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor={`edit-question-${item.id}`} className="form-label">Question</label>
                          <input 
                            id={`edit-question-${item.id}`}
                            type="text"
                            {...registerEditItem('question')}
                            className={`form-input ${editItemErrors.question ? 'input-error' : ''}`}
                            disabled={isUpdatingItem}
                          />
                          {editItemErrors.question && (
                            <p className="form-error">{editItemErrors.question.message}</p>
                          )}
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor={`edit-answer-${item.id}`} className="form-label">Réponse</label>
                          <textarea 
                            id={`edit-answer-${item.id}`}
                            {...registerEditItem('answer')}
                            className={`form-textarea ${editItemErrors.answer ? 'input-error' : ''}`}
                            rows={5}
                            disabled={isUpdatingItem}
                          />
                          {editItemErrors.answer && (
                            <p className="form-error">{editItemErrors.answer.message}</p>
                          )}
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor={`edit-order-${item.id}`} className="form-label">Ordre d'affichage</label>
                          <input 
                            id={`edit-order-${item.id}`}
                            type="number"
                            min="1"
                            step="1"
                            {...registerEditItem('order', { valueAsNumber: true })}
                            className={`form-input ${editItemErrors.order ? 'input-error' : ''}`}
                            disabled={isUpdatingItem}
                          />
                          {editItemErrors.order && (
                            <p className="form-error">{editItemErrors.order.message}</p>
                          )}
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="faq-item-header d-flex justify-content-between align-items-center">
                          <h4 style={{ 
                            fontWeight: '600', 
                            marginBottom: '8px',
                            color: '#111827'
                          }}>
                            <span style={{ marginRight: '8px', color: '#6366f1' }}>{item.order}.</span>
                            {item.question}
                            <TranslationIcon 
                              entityType="DetailedFaqPageItem" 
                              entityId={item.id} 
                              field="question" 
                              languageCode="en"
                              className="ml-sm"
                            />
                          </h4>
                          <div className="action-buttons">
                            <button
                              type="button"
                              onClick={() => startEditing(item)}
                              className="btn btn-icon mr-2"
                              aria-label="Modifier cette question"
                              style={{
                                padding: '6px',
                                borderRadius: '50%',
                                backgroundColor: '#e0f2fe',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginRight: '8px'
                              }}
                            >
                              <PenSquare size={16} color="#0ea5e9" />
                            </button>
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
                        </div>
                        
                        <div className="faq-item-content">
                          <p className="answer-text" style={{ 
                            margin: '8px 0',
                            color: '#4b5563',
                            fontSize: '0.95rem',
                            lineHeight: '1.5'
                          }}>
                            {item.answer}
                            <TranslationIcon 
                              entityType="DetailedFaqPageItem" 
                              entityId={item.id} 
                              field="answer" 
                              languageCode="en"
                              className="ml-sm"
                            />
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="card-footer">
            <div className="d-flex justify-content-between">
              <button
                type="button"
                onClick={() => router.push('/landing/detailedFaqPage')}
                className="btn btn-secondary btn-medium"
              >
                Retour à la liste
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .form-divider {
          margin: 2rem 0;
          border-top: 1px solid #e5e7eb;
        }
        
        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        
        .form-subtitle {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        
        .info-display {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .info-label {
          color: #6b7280;
        }
        
        .form-header {
          margin-bottom: 1rem;
        }
        
        .add-item-form, .edit-item-form {
          background-color: #f9fafb;
          padding: 1.5rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .form-actions {
          margin-top: 1.5rem;
          text-align: right;
        }
        
        .empty-state {
          text-align: center;
          padding: 2rem;
          background-color: #f9fafb;
          border-radius: 0.5rem;
          color: #6b7280;
        }
        
        .loading-spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #ef4444;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
        }
        
        .btn-icon:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .form-header-actions {
          display: flex;
          align-items: center;
        }
        
        .form-help {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        
        .action-buttons {
          display: flex;
          align-items: center;
        }
        
        .gap-sm {
          gap: 0.5rem;
        }
        
        .ml-sm {
          margin-left: 0.5rem;
        }
        
        .mr-2 {
          margin-right: 0.5rem;
        }
        
        .mt-md {
          margin-top: 1rem;
        }
        
        .mt-lg {
          margin-top: 2rem;
        }
      `}</style>
    </div>
  )
} 