'use client';

import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { useState, useEffect } from 'react';
import DynamicMethods from "@/app/components/Methods";
import styles from './homepage.module.scss';
import Navbar from './components/Navbar/Navbar';
import SideMenu from './components/SideMenu/SideMenu';
import AuthObserver from './components/Auth/AuthObserver';

const checkIsDarkSchemePreferred = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia?.('(prefers-color-scheme:dark)')?.matches ?? false;
  }
  return false;
};

export default function Main() {
  const [isDarkMode, setIsDarkMode] = useState(checkIsDarkSchemePreferred);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setIsDarkMode(checkIsDarkSchemePreferred());
    
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

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
