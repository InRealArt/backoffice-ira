"use client";

import React, { useState } from "react";
import LoadingSpinner from "@/app/components/LoadingSpinner/LoadingSpinner";
import Modal from "@/app/components/Common/Modal";

interface DeleteActionButtonProps {
  onDelete: () => Promise<void>;
  isDeleting?: boolean;
  disabled?: boolean;
  itemName?: string;
  confirmTitle?: string;
  confirmMessage?: string;
  buttonText?: string;
  buttonSize?: "small" | "medium" | "large";
  className?: string;
}

export function DeleteActionButton({
  onDelete,
  isDeleting = false,
  disabled = false,
  itemName = "cet élément",
  confirmTitle = "Confirmation de suppression",
  confirmMessage,
  buttonText = "Supprimer",
  buttonSize = "small",
  className = "",
}: DeleteActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    setIsModalOpen(false);
    setIsProcessing(true);

    try {
      await onDelete();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsModalOpen(false);
  };

  const defaultMessage =
    confirmMessage ||
    `Êtes-vous sûr de vouloir supprimer ${itemName} ? Cette action est irréversible.`;

  const isButtonDisabled = disabled || isDeleting || isProcessing;

  return (
    <>
      <button
        onClick={handleDeleteClick}
        className={`btn btn-danger btn-${buttonSize} ${className}`}
        disabled={isButtonDisabled}
      >
        {isDeleting || isProcessing ? (
          <LoadingSpinner size="small" message="" inline />
        ) : (
          buttonText
        )}
      </button>

      <Modal isOpen={isModalOpen} onClose={handleCancel} title={confirmTitle}>
        <div className="flex flex-col gap-4">
          <p className="text-red-600 text-base leading-relaxed">
            {defaultMessage}
          </p>

          <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-200">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleCancel(e);
              }}
              disabled={isProcessing}
            >
              Annuler
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                handleConfirm();
              }}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="small" message="" inline />
                  <span>Suppression...</span>
                </>
              ) : (
                "Confirmer la suppression"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default DeleteActionButton;
