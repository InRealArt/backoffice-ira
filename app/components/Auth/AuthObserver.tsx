'use client';

import { useEffect, useState } from 'react';
import { useIsLoggedIn, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useRouter } from 'next/navigation';

export default function AuthObserver() {
  const isLoggedIn = useIsLoggedIn();
  const { user, primaryWallet } = useDynamicContext();
  const router = useRouter();
  const [previousLoginState, setPreviousLoginState] = useState(false);

  useEffect(() => {
    const saveShopifyUserToPrisma = async () => {
      if (isLoggedIn && user && primaryWallet) {
        try {
          const response = await fetch('/api/auth/saveShopifyUser', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email || null,
              walletAddress: primaryWallet.address,
              userMetadata: user.metadata
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', errorData);
          } else {
            console.log('Utilisateur enregistré avec succès');
            
            // Si l'utilisateur vient de se connecter, rediriger vers le dashboard
            if (!previousLoginState && isLoggedIn) {
              router.push('/dashboard');
            }
          }
        } catch (err) {
          console.error('Exception lors de l\'enregistrement:', err);
        }
      }
    };

    saveShopifyUserToPrisma();
    
    // Mettre à jour l'état précédent
    setPreviousLoginState(isLoggedIn);
  }, [isLoggedIn, user, primaryWallet, previousLoginState, router]);

  return null;
}