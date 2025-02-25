'use client';

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { supabase } from '@/lib/supabase';
import ShopifyRequestModal from '../Shopify/ShopifyRequestModal';
import './Dashboard.css';

export default function Dashboard() {
  const { user, primaryWallet } = useDynamicContext();
  const [isLoading, setIsLoading] = useState(true);
  const [shopifyGranted, setShopifyGranted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkShopifyStatus = async () => {
      if (user && primaryWallet) {
        try {
          const { data, error } = await supabase
            .from('ShopifyUser')
            .select('isShopifyGranted')
            .eq('walletAddress', primaryWallet.address)
            .single();
          
          if (data) {
            setShopifyGranted(data.isShopifyGranted);
          }
          
          setIsLoading(false);
        } catch (err) {
          console.error('Erreur lors de la vérification du statut Shopify:', err);
          setIsLoading(false);
        }
      }
    };

    checkShopifyStatus();
  }, [user, primaryWallet]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitForm = async (formData: { firstName: string; lastName: string }) => {
    if (user && primaryWallet) {
      try {
        // Ici, vous pouvez envoyer les données à votre API
        console.log('Données du formulaire:', formData);
        
        // Fermer la modale après soumission
        setIsModalOpen(false);
        
        // Vous pourriez vouloir mettre à jour le statut ou afficher un message de succès
      } catch (error) {
        console.error('Erreur lors de l\'envoi du formulaire:', error);
      }
    }
  };

  if (isLoading) return <div className="dashboard-loading">Chargement...</div>;

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Tableau de bord</h2>
      
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h3>Informations utilisateur</h3>
          <p><strong>Email:</strong> {user?.email || 'Non défini'}</p>
          <p><strong>Adresse wallet:</strong> {primaryWallet?.address || 'Non défini'}</p>
          <p><strong>Statut Shopify:</strong> {shopifyGranted ? 'Connecté' : 'Non connecté'}</p>
        </div>

        {!shopifyGranted && (
          <div className="dashboard-card">
            <h3>Connexion Shopify</h3>
            <p>Vous n'êtes pas encore un membre du Shopify d'InRealArt.</p>
            <button className="dashboard-button" onClick={handleOpenModal}>
              Devenir membre
            </button>
          </div>
        )}
      </div>

      <ShopifyRequestModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        userEmail={user?.email} 
        onSubmit={handleSubmitForm} 
      />
    </div>
  );
}