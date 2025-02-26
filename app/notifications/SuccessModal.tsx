'use client'

import Modal from '@/app/components/Common/Modal'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
}

export default function SuccessModal({
  isOpen,
  onClose,
  message
}: SuccessModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Information"
    >
      <div className="success-modal">
        <p>{message}</p>
        <div className="modal-actions">
          <button 
            className="modal-button ok"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  )
}