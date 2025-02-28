'use client';

import Dashboard from '../components/Dashboard/Dashboard';
import AuthObserver from '../components/Auth/AuthObserver';
import Navbar from '../components/Navbar/Navbar';
import SideMenu from '../components/SideMenu/SideMenu';
import { useIsLoggedIn } from '@dynamic-labs/sdk-react-core';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import styles from './dashboard.module.scss'; // Import du module SCSS

export default function DashboardPage() {
  const isLoggedIn = useIsLoggedIn();
  const router = useRouter();
  
  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, rediriger vers la page d'accueil
    if (isLoggedIn === false) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  return (
    <>
      <AuthObserver />
      <Navbar />
      <div className={styles.dashboardPage}>
        <SideMenu />
        <div className={styles.dashboardContent}>
          <Dashboard />
        </div>
      </div>
    </>
  );
}