'use client';

import { useState } from 'react';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarLogo}>InRealArt</div>
      <div className={styles.navbarMenuContainer}>
        <button className={styles.menuButton} onClick={toggleMenu}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {menuOpen && (
          <div className={styles.dropdownMenu}>
            <div className={styles.widgetMenuItem}>
              <span className={styles.menuItemLabel}>Connexion</span>
              <DynamicWidget variant="modal" />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}