'use client'

import Modal from '@/app/components/Common/Modal'

interface RejectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  userEmail?: string
}

export default function RejectModal({
  isOpen,
  onClose,
  onConfirm,
  userEmail
}: RejectModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Confirmation de rejet"
    >
      <div className="confirmation-modal">
        <p>
          Êtes-vous sûr de vouloir rejeter la demande d'accès Shopify de <strong>{userEmail}</strong> ?
        </p>
        <p className="warning-text">
          Cette action est irréversible.
        </p>
        <div className="modal-actions">
          <button 
            className="modal-button confirm"
            onClick={onConfirm}
          >
            Confirmer le rejet
          </button>
          <button 
            className="modal-button cancel"
            onClick={onClose}
          >
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  )
}