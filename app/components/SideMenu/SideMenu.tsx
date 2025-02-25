'use client';

import { useIsLoggedIn, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import './SideMenu.css';

export default function SideMenu() {
  const isLoggedIn = useIsLoggedIn();
  const { primaryWallet } = useDynamicContext();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [canAccessCollection, setCanAccessCollection] = useState(false);

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
          
        } catch (err) {
          console.error('Erreur lors de la vérification des accès:', err);
          setCanAccessCollection(false);
        }
      }
    };
  
    checkUserAccess();
  }, [isLoggedIn, primaryWallet]);

  
  if (!isLoggedIn) return null;

  return (
    <div className="side-menu">
      <ul className="menu-list">
        <li 
          className={`menu-item ${activeItem === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveItem('dashboard')}
        >
          Dashboard
        </li>
        
        {canAccessCollection === true && (
          <li 
            className={`menu-item ${activeItem === 'collection' ? 'active' : ''}`}
            onClick={() => setActiveItem('collection')}
          >
            Ma Collection
          </li>
        )}
        
      </ul>
    </div>
  );
}