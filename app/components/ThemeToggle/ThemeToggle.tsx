'use client'

import { useThemeStore } from '@/app/hooks/useThemeStore'
import styles from './ThemeToggle.module.scss'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()
  const [mounted, setMounted] = useState(false)
  
  // S'assurer que le composant est monté pour éviter les problèmes d'hydratation
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const handleToggle = () => {
    console.log('Thème actuel avant le clic:', theme)
    toggleTheme()
    console.log('Thème basculé vers:', theme === 'light' ? 'dark' : 'light')
  }
  
  // Éviter le rendu pendant le montage pour éviter les problèmes d'hydratation
  if (!mounted) {
    return (
      <button className={styles.themeToggle}>
        <span className="sr-only">Chargement...</span>
      </button>
    )
  }
  
  return (
    <button 
      onClick={handleToggle}
      className={styles.themeToggle}
      aria-label={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'} 
      title={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
      data-theme={theme} // Attribut de donnée pour aider au débogage
    >
      {theme === 'light' ? (
        // Icône lune (mode sombre)
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      ) : (
        // Icône soleil (mode clair)
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      )}
    </button>
  )
} 