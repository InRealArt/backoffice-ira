'use client';

import { useState } from 'react';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import styles from './Navbar.module.scss';
import Image from 'next/image';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarLogo}>
        <div className={styles.logoContainer}>
          <Image
            src="/img/Logo_InRealArt.svg"
            alt="InRealArt Logo"
            width={60}
            height={60}
            className={styles.logoImage}
          />
        </div>
        <span className={styles.logoText}>InRealArt backoffice</span>
      </div>
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
              <div className={styles.dynamicWidgetContainer}>
                <DynamicWidget variant="modal" />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}