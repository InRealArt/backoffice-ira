'use client';

import { useState } from 'react';
import './ShopifyRequestModal.css';

interface ShopifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | undefined;
  onSubmit: (formData: { firstName: string; lastName: string }) => void;
}

export default function ShopifyRequestModal({ isOpen, onClose, userEmail, onSubmit }: ShopifyModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ firstName, lastName });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        
        <h2 className="modal-title">Devenir membre Shopify</h2>
        
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={userEmail || ''} 
              disabled 
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">Nom</label>
            <input 
              type="text" 
              id="lastName" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
              required
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="firstName">Prénom</label>
            <input 
              type="text" 
              id="firstName" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
              required
              className="form-control"
            />
          </div>
          
          <button type="submit" className="submit-button">
            Envoyer la demande
          </button>
        </form>
      </div>
    </div>
  );
}