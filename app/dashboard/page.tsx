'use client';

import Dashboard from '../components/Dashboard/Dashboard';
import AuthObserver from '../components/Auth/AuthObserver';
import Navbar from '../components/Navbar/Navbar';
import SideMenu from '../components/SideMenu/SideMenu';
import { useIsLoggedIn } from '@dynamic-labs/sdk-react-core';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import './dashboard.css'; // Importer les styles

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
      <div className="dashboard-page">
        <SideMenu />
        <div className="dashboard-content">
          <Dashboard />
        </div>
      </div>
    </>
  );
}