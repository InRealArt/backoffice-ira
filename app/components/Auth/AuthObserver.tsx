'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/app/components/Toast/ToastContext';
import UnauthorizedMessage from './UnauthorizedMessage';
import WalletEventListener from './WalletEventListener';
import { checkAuthorizedUser } from '@/lib/actions/auth-actions';

export default function AuthObserver() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const userEmail = user?.email;
  const isLoggedIn = !!session;
  const router = useRouter();
  const pathname = usePathname();
  const [previousLoginState, setPreviousLoginState] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const checkingRef = useRef(false);
  const authorizedRef = useRef<string | null>(null);
  const { error: errorToast } = useToast()
  
  // Mémoriser la fonction de toast pour éviter les re-renders
  const showError = useCallback((message: string) => {
    errorToast(message);
  }, [errorToast]);
  
  const redirectHome = useCallback(() => {
    router.push('/');
  }, [router]);
  
  // Vérifier si l'utilisateur est autorisé lorsqu'il se connecte
  useEffect(() => {
    let isMounted = true

    const checkUserAuthorization = async () => {
      // Éviter les vérifications multiples pour le même email
      if (authorizedRef.current === userEmail || checkingRef.current) {
        return
      }

      if (isLoggedIn && userEmail && !isPending) {
        checkingRef.current = true
        try {
          // Utilisation de la Server Action au lieu de l'API Route
          const result = await checkAuthorizedUser(userEmail);
          
          if (!isMounted) return
          
          authorizedRef.current = userEmail
          setIsAuthorized(result.authorized);
          
          if (!result.authorized && pathname !== '/') {
            // Rediriger vers la page d'accueil si l'utilisateur n'est pas autorisé
            redirectHome();
            showError('Vous n\'êtes pas autorisé à accéder à cette application');
          }
        } catch (error) {
          if (!isMounted) return
          console.error('Erreur lors de la vérification de l\'autorisation:', error);
          setIsAuthorized(false);
        } finally {
          checkingRef.current = false
        }
      } else if (!isLoggedIn && !isPending) {
        authorizedRef.current = null
        if (isMounted) {
          setIsAuthorized(null);
        }
      }
    };

    checkUserAuthorization();

    return () => {
      isMounted = false
    }
  }, [userEmail, isLoggedIn, isPending, pathname, redirectHome, showError]);

  useEffect(() => {
    // Rediriger vers la page d'accueil lorsque l'utilisateur se déconnecte
    if (previousLoginState && !isLoggedIn && !isPending) {
      redirectHome();
    }
    
    // Mettre à jour l'état précédent
    setPreviousLoginState(isLoggedIn);
  }, [isLoggedIn, previousLoginState, isPending, redirectHome]);

  return (
    <>
      {isLoggedIn && <WalletEventListener />}
      {/* Le reste du composant reste inchangé */}
    </>
  );
}