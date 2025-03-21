'use client';

import { useState } from 'react';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import Image from 'next/image';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <div className="logo-container">
          <Image
            src="/img/Logo_InRealArt.svg"
            alt="InRealArt Logo"
            width={60}
            height={60}
            className="logo-image"
          />
        </div>
        <span className="logo-text">InRealArt backoffice</span>
      </div>
      <div className="navbar-menu-container">
        <div className="navbar-actions">
          <ThemeToggle />
          <button className="menu-button" onClick={toggleMenu} aria-label="Menu utilisateur">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        {menuOpen && (
          <div className="dropdown-menu">
            <div className="widget-menu-item">
              <span className="menu-item-label">Connexion</span>
              <div className="dynamic-widget-container">
                <DynamicWidget variant="modal" />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}