'use client';

import { useState } from 'react';
import styles from './ShopifyRequestModal.module.scss';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

interface ShopifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | undefined;
  onSubmit: (formData: { firstName: string; lastName: string }) => void;
  isSubmitting?: boolean;
}

export default function ShopifyRequestModal({ 
  isOpen, 
  onClose, 
  userEmail, 
  onSubmit,
  isSubmitting = false
}: ShopifyModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  if (!isOpen) return null;

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ firstName, lastName });
  };
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <button className={styles.modalClose} onClick={onClose}>
          &times;
        </button>
        
        <h2 className={styles.modalTitle}>Devenir membre Shopify</h2>
        
        <form className={styles.modalForm} onSubmit={handleSubmitForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={userEmail || ''} 
              disabled 
              className={styles.formControl}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="lastName">Nom</label>
            <input 
              type="text" 
              id="lastName" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
              required
              disabled={isSubmitting}
              className={styles.formControl}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="firstName">Prénom</label>
            <input 
              type="text" 
              id="firstName" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
              required
              disabled={isSubmitting}
              className={styles.formControl}
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className={styles.loadingContainer}>
                <LoadingSpinner size="small" message="" inline color="light" />
                <span>Envoi en cours...</span>
              </span>
            ) : (
              'Envoyer la demande'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}