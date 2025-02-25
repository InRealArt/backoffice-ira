'use client';

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useRouter } from 'next/navigation';
import './page.css'; 
import SideMenu from '@/app/components/SideMenu/SideMenu';
import Navbar from '@/app/components/Navbar/Navbar';
import Dashboard from '@/app/components/Dashboard/Dashboard';

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
    return <div className="collection-loading">Chargement...</div>;
  }

  return (
    <div className="collection-container">
      <h1 className="collection-title">Ma Collection</h1>
      
      <div className="collection-content">
        <p>Bienvenue dans votre collection.</p>
        <p>Le contenu de votre collection apparaîtra ici.</p>
      </div>
      <Navbar />
      <SideMenu />
    </div>
  );
}