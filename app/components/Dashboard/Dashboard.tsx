'use client';

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { supabase } from '@/lib/supabase';
import ShopifyRequestModal from '../Shopify/ShopifyRequestModal';
import './Dashboard.css';
import toast from 'react-hot-toast';
import { submitShopifyRequest } from '@/app/actions/shopify/submitShopifyRequest';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user, primaryWallet } = useDynamicContext();
  const [isLoading, setIsLoading] = useState(true);
  const [shopifyGranted, setShopifyGranted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const truncateAddress = (address: string | undefined) => {
    if (!address) return 'Non défini';
    const start = address.substring(0, 6);
    const end = address.substring(address.length - 4);
    return `${start}...${end}`;
  };

  useEffect(() => {
    const checkShopifyStatus = async () => {
      if (user && primaryWallet) {
        try {
          // Utiliser la nouvelle route API au lieu de l'appel Supabase direct
          const response = await fetch('/api/shopify/isArtistAndGranted', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: primaryWallet.address
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
          }
          
          const result = await response.json();
          
          if (result.data && result.data.length > 0) {
            // Utiliser seulement isShopifyGranted pour la compatibilité avec le code existant
            setShopifyGranted(result.data[0].isShopifyGranted);
          }
          
          // Vérifier si l'utilisateur est admin
          const adminResponse = await fetch('/api/shopify/isAdmin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: primaryWallet.address
            }),
          });
          
          if (adminResponse.ok) {
            const adminResult = await adminResponse.json();
            
            setIsAdmin(adminResult.isAdmin);
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

  const handleSubmitShopifyRequest = async (formData: { firstName: string; lastName: string }) => {
    if (user?.email) {
        try {
          // Utiliser le server action à la place de l'appel API direct
          const result = await submitShopifyRequest({
            email: user.email,
            firstName: formData.firstName,
            lastName: formData.lastName
          });
    
          if (!result.success) {
            throw new Error(result.error || "Erreur inconnue");
          }
    
          // Fermer la modale après soumission
          setIsModalOpen(false);
          
          // Afficher un message de succès
          toast.success('Votre demande a été envoyée avec succès. Nous la traiterons dans les plus brefs délais.');
          
        } catch (error) {
          console.error('Erreur lors de l\'envoi du formulaire:', error);
          toast.error('Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.');
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
          <p><strong>Adresse wallet:</strong> <span className="small-text">{truncateAddress(primaryWallet?.address)}</span></p>
          <p><strong>Statut Shopify:</strong> {shopifyGranted ? 'Connecté' : 'Non connecté'}</p>
        </div>

         {shopifyGranted ? (
          <div className="dashboard-card">
            <h3>Accès Collection</h3>
            <p>Vous êtes un membre du Shopify d'InRealArt.</p>
            <button 
              className="dashboard-button" 
              onClick={() => router.push('/shopify/collection')}
            >
              Ma Collection
            </button>
          </div>
        ) : isAdmin ? (
          <div className="dashboard-card">
            <h3>Panneau d'Administration</h3>
            <p>Accès aux fonctionnalités d'administration.</p>
            <button 
              className="dashboard-button" 
              onClick={() => router.push('/notifications')}
            >
              Voir notifications
            </button>
          </div>
        ) : (
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
        onSubmit={handleSubmitShopifyRequest} 
      />
    </div>
  );
}