'use client';

import { useIsLoggedIn, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import './SideMenu.css';
import { useRouter } from 'next/navigation';

export default function SideMenu() {
  const isLoggedIn = useIsLoggedIn();
  const { primaryWallet } = useDynamicContext();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [canAccessCollection, setCanAccessCollection] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    const checkUserAccess = async () => {
      if (isLoggedIn && primaryWallet) {
        try {
          console.log('Vérification accès pour:', primaryWallet.address);
          
          const response = await fetch('/api/shopify/isArtistAndGranted', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: primaryWallet.address
            }),
          });
          console.log('response', response)
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erreur ${response.status}`);
          }
          
          const result = await response.json();
          console.log('Résultat API:', result);
          console.log('hasAccess', result.hasAccess);
          setCanAccessCollection(result.hasAccess === true);
          
          // Vérifier si l'utilisateur est admin
          const adminResponse = await fetch('/api/shopify/isAdmin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: primaryWallet.address
            }),
          });
          
          if (adminResponse.ok) {
            const adminResult = await adminResponse.json();
            setIsAdmin(adminResult.isAdmin);
          }
          
        } catch (err) {
          console.error('Erreur lors de la vérification des accès:', err);
          setCanAccessCollection(false);
        }
      }
    };
  
    checkUserAccess();
  }, [isLoggedIn, primaryWallet]);

  
  if (!isLoggedIn) return null;

  const handleNavigation = (route: string, menuItem: string) => {
    setActiveItem(menuItem);
    router.push(route);
  };


  return (
    <div className="side-menu">
      <ul className="menu-list">
        <li 
          className={`menu-item ${activeItem === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavigation('/dashboard', 'dashboard')}
        >
          Dashboard
        </li>
        
        {canAccessCollection && !isAdmin && (
          <li 
            className={`menu-item ${activeItem === 'collection' ? 'active' : ''}`}
            onClick={() => handleNavigation('/shopify/collection', 'collection')}
          >
            Ma Collection
          </li>
        )}
        
        {isAdmin && (
          <li 
            className={`menu-item ${activeItem === 'notifications' ? 'active' : ''}`}
            onClick={() => handleNavigation('/notifications', 'notifications')}
          >
            Notifications
          </li>
        )}
        
      </ul>
    </div>
  );
}