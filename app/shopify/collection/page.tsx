'use client';

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useRouter } from 'next/navigation';
import styles from './collection.module.scss';
import SideMenu from '@/app/components/SideMenu/SideMenu';
import Navbar from '@/app/components/Navbar/Navbar';
import Dashboard from '@/app/components/Dashboard/Dashboard';
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'

export default function MyCollection() {
  const { user, primaryWallet } = useDynamicContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    if (!user || !primaryWallet) {
      router.push('/');
      return;
    }

    // Vérifier les droits d'accès
    const checkAccess = async () => {
      try {
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
          throw new Error('Erreur lors de la vérification des droits');
        }
        
        const result = await response.json();
        
        if (result.hasAccess) {
          setHasAccess(true);
          setIsLoading(false);
        } else {
          // Rediriger si l'utilisateur n'a pas les droits
          router.push('/');
        }
      } catch (error) {
        console.error('Erreur:', error);
        router.push('/');
      }
    };

      checkAccess();
  }, [user, primaryWallet, router]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="page-layout">
          <SideMenu />
          <div className="content-container">
            <LoadingSpinner message="Chargement de votre collection..." />
          </div>
        </div>
      </>
    )
  }

  return (
    <div className={styles.collectionContainer}>
      <h1 className={styles.collectionTitle}>Ma Collection</h1>
      
      <div className={styles.collectionContent}>
        <p>Bienvenue dans votre collection.</p>
        <p>Le contenu de votre collection apparaîtra ici.</p>
      </div>
      <Navbar />
      <SideMenu />
    </div>
  );
}