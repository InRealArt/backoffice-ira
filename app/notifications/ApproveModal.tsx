'use client'

import Modal from '@/app/components/Common/Modal'
import CollectionCreationModal from './CollectionCreationModal'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { createAdminRestApiClient } from '@shopify/admin-api-client'
import { createShopifyCollection } from '../actions/shopify/shopifyActions'
import { NotificationStatus } from '@prisma/client'
import { updateNotificationStatus } from '../actions/prisma/prismaActions'
interface ApproveModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  userEmail?: string
  userFirstName?: string
  userLastName?: string
  isLoading: boolean
  notificationId: number 
}

export default function ApproveModal({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
  userFirstName,
  userLastName,
  isLoading,
  notificationId
}: ApproveModalProps) {

    const [showCollectionModal, setShowCollectionModal] = useState(false)
    const [isCreatingCollection, setIsCreatingCollection] = useState(false)

    const handleCreateCollection = async () => {
        try {
        
          setIsCreatingCollection(true)
      
          // Création du nom de la collection basé sur le prénom et nom de l'utilisateur
          const collectionName = `${userFirstName || ''} ${userLastName || ''}`.trim()
          
          // 1. Créer la collection Shopify
          const collectionResult = await createShopifyCollection(collectionName)
          
          if (!collectionResult.success) {
            toast.error(collectionResult.message)
            return
          }
          
          // 2. Mettre à jour le statut de la notification séparément
          const updateResult = await updateNotificationStatus(notificationId, NotificationStatus.APPROVED)
          
          if (!updateResult.success) {
            toast.error(`Collection créée mais ${updateResult.message}`)
            return
          }
          
          // Si tout s'est bien passé
          toast.success(`Collection créée et notification approuvée avec succès!`)
          onClose()
          onConfirm() // Rafraîchir les données

        } catch (error) {
            console.error('Erreur lors de la création de la collection:', error)
            toast.error('Échec de création de la collection. Veuillez réessayer.')
        } finally {
            setIsCreatingCollection(false)
        }
      }
    
      const handleCloseCollectionModal = () => {
        setShowCollectionModal(false)
      }


    if (showCollectionModal) {
        return (
        <CollectionCreationModal
            isOpen={isOpen}
            onClose={handleCloseCollectionModal}
            onConfirm={onConfirm}
            userFirstName={userFirstName}
            userLastName={userLastName}
        />
        )
    }
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Confirmation"
    >
      <div className="confirmation-modal">
        {isLoading ? (
          <p>Chargement des informations utilisateur...</p>
        ) : (
          <>
            <p>
              Rendez vous sur <strong>https://admin.shopify.com/store/inrealart-marketplace/settings/account</strong> pour créer un staff account
            </p>
            <div className="user-details">
              <p><strong>Email:</strong> {userEmail}</p>
              <p><strong>Prénom:</strong> {userFirstName}</p>
              <p><strong>Nom:</strong> {userLastName}</p>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-button confirm"
                onClick={() => window.open('https://admin.shopify.com/store/inrealart-marketplace/settings/account', '_blank')}
              >
                Aller sur Shopify
              </button>
              <button 
                className="modal-button action"
                onClick={handleCreateCollection}
              >
                {`Créer une collection pour ${userFirstName || ''} ${userLastName || ''}`}
              </button>
              <button 
                className="modal-button cancel"
                onClick={onClose}
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}