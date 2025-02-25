'use client';

import { useIsLoggedIn } from '@dynamic-labs/sdk-react-core';
import { useState } from 'react';
import './SideMenu.css';

export default function SideMenu() {
  const isLoggedIn = useIsLoggedIn();
  const [activeItem, setActiveItem] = useState('dashboard');

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
        <li 
          className={`menu-item ${activeItem === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveItem('settings')}
        >
          Paramètres
        </li>
      </ul>
    </div>
  );
}