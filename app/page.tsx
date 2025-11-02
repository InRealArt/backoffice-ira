'use client';

import { useState, useEffect } from 'react';
import styles from './homepage.module.scss';
import Navbar from './components/Navbar/Navbar';
import AuthObserver from './components/Auth/AuthObserver';
import UnauthorizedMessage from './components/Auth/UnauthorizedMessage';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import { authClient } from '@/lib/auth-client';
import { checkAuthorizedUser } from '@/lib/actions/auth-actions';
import { useRouter } from 'next/navigation';

const checkIsDarkSchemePreferred = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia?.('(prefers-color-scheme:dark)')?.matches ?? false;
  }
  return false;
};

export default function Main() {
  const [isDarkMode, setIsDarkMode] = useState(checkIsDarkSchemePreferred);
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const userEmail = user?.email;
  const isLoggedIn = !!session;
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setIsDarkMode(checkIsDarkSchemePreferred());
    
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    let isMounted = true

    const checkAuthorization = async () => {
      // Réinitialiser la redirection si l'état change
      if (!isLoggedIn && !isPending) {
        if (isMounted) {
          setIsAuthorized(null);
          setHasRedirected(false);
        }
        return;
      }

      if (isLoggedIn && userEmail && !isPending && !hasRedirected) {
        setIsLoading(true);
        try {
          // Utilisation de la Server Action au lieu de l'API Route
          const result = await checkAuthorizedUser(userEmail);
          
          if (!isMounted) return
          
          setIsAuthorized(result.authorized);
          
          // Rediriger immédiatement si autorisé (évite un useEffect séparé)
          if (result.authorized && !hasRedirected) {
            setHasRedirected(true);
            router.push('/dashboard');
          }
        } catch (error) {
          if (!isMounted) return
          console.error('Erreur lors de la vérification de l\'autorisation:', error);
          setIsAuthorized(false);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    };

    checkAuthorization();

    return () => {
      isMounted = false
    }
  }, [isLoggedIn, userEmail, isPending, hasRedirected, router]);

  if (isPending || isLoading) {
    return (
      <>
        <Navbar />
        <LoadingSpinner message="Vérification de vos accès..." />
      </>
    );
  }

  if (isLoggedIn && isAuthorized === false) {
    return (
      <>
        <Navbar />
        <UnauthorizedMessage />
      </>
    );
  }

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ''}`}>
      <AuthObserver />
      <Navbar />
      <div className={styles.header}>
        {/*
        <img className={styles.logo} src={isDarkMode ? "/logo-light.png" : "/logo-dark.png"} alt="dynamic" />
        <div className={styles.headerButtons}>
          <button className={styles.docsButton} onClick={() => window.open('https://docs.dynamic.xyz', '_blank', 'noopener,noreferrer')}>Docs</button>
          <button className={styles.getStarted} onClick={() => window.open('https://app.dynamic.xyz', '_blank', 'noopener,noreferrer')}>Get started</button>
        </div>
        */}
      </div>
      <div className={styles.modal}>
        <h1 className={styles.welcomeTitle}>Welcome to InRealArt backoffice</h1>
        {!isLoggedIn && (
          <div className="flex flex-col items-center gap-4">
            <p className={styles.loginNote}>
              Connectez-vous pour accéder au backoffice
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push('/sign-in')}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Se connecter
              </button>
              <button
                onClick={() => router.push('/sign-up')}
                className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
              >
                S'inscrire
              </button>
            </div>
          </div>
        )}
      </div>
    </div> 
  );
}
