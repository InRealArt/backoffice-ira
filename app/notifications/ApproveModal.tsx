'use client'

import Modal from '@/app/components/Common/Modal'

interface ApproveModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  userEmail?: string
  userFirstName?: string
  userLastName?: string
  isLoading: boolean
}

export default function ApproveModal({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
  userFirstName,
  userLastName,
  isLoading
}: ApproveModalProps) {
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
                onClick={onConfirm}
              >
                Confirmer la création
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