'use client';

import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { useState, useEffect } from 'react';
import DynamicMethods from "@/app/components/Methods";
import styles from './homepage.module.scss';
import Navbar from './components/Navbar/Navbar';
import SideMenu from './components/SideMenu/SideMenu';
import AuthObserver from './components/Auth/AuthObserver';
import UnauthorizedMessage from './components/Auth/UnauthorizedMessage';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import { useIsLoggedIn, useDynamicContext } from '@dynamic-labs/sdk-react-core';

const checkIsDarkSchemePreferred = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia?.('(prefers-color-scheme:dark)')?.matches ?? false;
  }
  return false;
};

export default function Main() {
  const [isDarkMode, setIsDarkMode] = useState(checkIsDarkSchemePreferred);
  const isLoggedIn = useIsLoggedIn();
  const { user } = useDynamicContext();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setIsDarkMode(checkIsDarkSchemePreferred());
    
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (isLoggedIn && user?.email) {
        setIsLoading(true);
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
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'autorisation:', error);
          setIsAuthorized(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsAuthorized(null);
      }
    };

    checkAuthorization();
  }, [isLoggedIn, user]);

  if (isLoading) {
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
      <SideMenu />
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
        <p className={styles.loginNote}>
          Vous pouvez vous connecter via le menu en haut à droite <span className={styles.loginArrow}>↗</span>
        </p>
      </div>
    </div> 
  );
}
