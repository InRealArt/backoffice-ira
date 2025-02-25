'use client';

import Dashboard from '../components/Dashboard/Dashboard';
import AuthObserver from '../components/Auth/AuthObserver';
import Navbar from '../components/Navbar/Navbar';
import SideMenu from '../components/SideMenu/SideMenu';
import { useIsLoggedIn } from '@dynamic-labs/sdk-react-core';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
    <div className="dashboard-page">
      <AuthObserver />
      <Navbar />
      <SideMenu />
      <Dashboard />
    </div>
  );
}