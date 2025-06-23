'use client';

import { useEffect, useState } from 'react';
import { useIsLoggedIn, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/app/components/Toast/ToastContext';
import UnauthorizedMessage from './UnauthorizedMessage';
import WalletEventListener from './WalletEventListener';

export default function AuthObserver() {
  const isLoggedIn = useIsLoggedIn();
  const { user, primaryWallet } = useDynamicContext();
  const router = useRouter();
  const pathname = usePathname();
  const [previousLoginState, setPreviousLoginState] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const { error: errorToast } = useToast()
  // Vérifier si l'utilisateur est autorisé lorsqu'il se connecte
  useEffect(() => {
    const checkUserAuthorization = async () => {
      if (isLoggedIn && user?.email && !isCheckingAuth) {
        setIsCheckingAuth(true);
        try {
          const response = await fetch('/api/auth/checkAuthorizedUser', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email
            }),
          });

          const data = await response.json();
          setIsAuthorized(data.authorized);
          
          if (!data.authorized && pathname !== '/') {
            // Rediriger vers la page d'accueil si l'utilisateur n'est pas autorisé
            router.push('/');
            errorToast('Vous n\'êtes pas autorisé à accéder à cette application');
          }
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'autorisation:', error);
          setIsAuthorized(false);
        } finally {
          setIsCheckingAuth(false);
        }
      } else if (!isLoggedIn) {
        setIsAuthorized(null);
      }
    };

    checkUserAuthorization();
  }, [user]);

  useEffect(() => {
    
    // Rediriger vers la page d'accueil lorsque l'utilisateur se déconnecte
    if (previousLoginState && !isLoggedIn) {
      router.push('/');
    }
    
    // Mettre à jour l'état précédent
    setPreviousLoginState(isLoggedIn);
  }, [isLoggedIn, user, primaryWallet, previousLoginState, router, isAuthorized]);

  return (
    <>
      {isLoggedIn && <WalletEventListener />}
      {/* Le reste du composant reste inchangé */}
    </>
  );
}