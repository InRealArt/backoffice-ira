'use client';

import { useEffect } from 'react';
import { useIsLoggedIn, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { prisma } from '@/lib/prisma';

export default function AuthObserver() {
  const isLoggedIn = useIsLoggedIn();
  const { user, primaryWallet } = useDynamicContext();

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
          }
        } catch (err) {
          console.error('Exception lors de l\'enregistrement:', err);
        }
      }
    };

    saveShopifyUserToPrisma();
  }, [isLoggedIn, user, primaryWallet]);

  return null;
}