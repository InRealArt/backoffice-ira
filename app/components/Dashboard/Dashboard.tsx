'use client';

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { supabase } from '@/lib/supabase';
import ShopifyRequestModal from '../Shopify/ShopifyRequestModal';
import styles from './Dashboard.module.scss';
import toast from 'react-hot-toast';
import { submitShopifyRequest } from '@/app/actions/shopify/submitShopifyRequest';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import Button from '../Button/Button';

export default function Dashboard() {
  const { user, primaryWallet } = useDynamicContext();
  const [isLoading, setIsLoading] = useState(true);
  const [shopifyGranted, setShopifyGranted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminNavigating, setIsAdminNavigating] = useState(false);
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

  const handleAdminShowUsers = () => {
    setIsAdminNavigating(true);
    router.push('/admin/shopify/users');
  };

  if (isLoading) return <LoadingSpinner fullPage message="Chargement du tableau de bord..." />;

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.dashboardTitle}>Tableau de bord</h2>
      
      <div className={styles.dashboardContent}>
        <div className={styles.dashboardCard}>
          <h3>Informations utilisateur</h3>
          <p><strong>Email:</strong> {user?.email || 'Non défini'}</p>
          <p><strong>Adresse wallet:</strong> <span className={styles.smallText}>{truncateAddress(primaryWallet?.address)}</span></p>
          <p><strong>Statut Shopify:</strong> {shopifyGranted ? 'Connecté' : 'Non connecté'}</p>
        </div>

        {isAdmin ? (
          <div className={styles.dashboardCard}>
            <h3>Panneau d'Administration</h3>
            <p>Voir les utilisateurs et leurs informations.</p>
            <Button
              onClick={handleAdminShowUsers}
              isLoading={isAdminNavigating}
              loadingText="Chargement..."
            >
              Voir les utilisateurs
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.dashboardCard}>
              <h3>Ma Collection</h3>
              <p>Explorez et gérez votre collection d'œuvres d'art.</p>
              <Button onClick={() => router.push('/shopify/collection')}>
                Voir ma collection d'œuvres d'art
              </Button>
            </div>
            
            <div className={styles.dashboardCard}>
              <h3>Création d'œuvre</h3>
              <p>Créez et publiez une nouvelle œuvre d'art dans Shopify.</p>
              <button 
                className={styles.dashboardButton} 
                onClick={() => router.push('/shopify/create')}
              >
                Créer une œuvre dans Shopify
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}