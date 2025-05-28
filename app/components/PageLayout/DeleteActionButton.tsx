'use client'

import React, { useState } from 'react'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Modal from '@/app/components/Common/Modal'

interface DeleteActionButtonProps {
  onDelete: () => Promise<void>
  isDeleting?: boolean
  disabled?: boolean
  itemName?: string
  confirmTitle?: string
  confirmMessage?: string
  buttonText?: string
  buttonSize?: 'small' | 'medium' | 'large'
  className?: string
}

export function DeleteActionButton({
  onDelete,
  isDeleting = false,
  disabled = false,
  itemName = 'cet élément',
  confirmTitle = 'Confirmation de suppression',
  confirmMessage,
  buttonText = 'Supprimer',
  buttonSize = 'small',
  className = ''
}: DeleteActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsModalOpen(true)
  }

  const handleConfirm = async () => {
    setIsModalOpen(false)
    setIsProcessing(true)
    
    try {
      await onDelete()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  const defaultMessage = confirmMessage || 
    `Êtes-vous sûr de vouloir supprimer ${itemName} ? Cette action est irréversible.`

  const isButtonDisabled = disabled || isDeleting || isProcessing

  return (
    <>
      <button
        onClick={handleDeleteClick}
        className={`btn btn-danger btn-${buttonSize} ${className}`}
        disabled={isButtonDisabled}
      >
        {(isDeleting || isProcessing) ? (
          <LoadingSpinner size="small" message="" inline />
        ) : (
          buttonText
        )}
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title={confirmTitle}
      >
        <div className="modal-content">
          <p className="text-danger">
            {defaultMessage}
          </p>
          
          <div className="modal-actions">
            <button 
              className="btn btn-secondary" 
              onClick={handleCancel}
              disabled={isProcessing}
            >
              Annuler
            </button>
            <button 
              className="btn btn-danger btn-medium" 
              onClick={handleConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="small" message="" inline />
                  <span className="ml-2">Suppression...</span>
                </>
              ) : (
                'Confirmer la suppression'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default DeleteActionButton 