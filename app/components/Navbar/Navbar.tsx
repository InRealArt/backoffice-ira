'use client';

import { useState } from 'react';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">InRealArt</div>
      <div className="navbar-menu-container">
        <button className="menu-button" onClick={toggleMenu}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {menuOpen && (
          <div className="dropdown-menu">
            <div className="menu-item widget-menu-item">
              <span className="menu-item-label">Connexion</span>
              <DynamicWidget variant="dropdown" />
            </div>
            <div className="menu-item">
              <span>Notifications</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}