'use client'

import Modal from '@/app/components/Common/Modal'

interface CollectionCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  userFirstName?: string
  userLastName?: string
}

export default function CollectionCreationModal({
  isOpen,
  onClose,
  onConfirm,
  userFirstName,
  userLastName
}: CollectionCreationModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Création de collection pour le membre shopify"
    >
      <div className="collection-creation-modal">
        <p className="warning-text">
          Warning ! Assurez vous bien que le membre fait partie du staff de shopify
        </p>
        <div className="user-details">
          <p><strong>Prénom:</strong> {userFirstName}</p>
          <p><strong>Nom:</strong> {userLastName}</p>
        </div>
        <div className="modal-actions">
          <button 
            className="modal-button confirm"
            onClick={onConfirm}
          >
            Confirmer
          </button>
          <button 
            className="modal-button cancel"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  )
}