'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/app/hooks/useThemeStore'


export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore()

  useEffect(() => {
    // Logique de base pour les classes
    const root = document.documentElement
    root.classList.remove('light-theme', 'dark-theme', 'dark', 'light')
    document.body.classList.remove('light', 'dark')
    
    if (theme === 'dark') {
      root.classList.add('dark-theme', 'dark') // 'dark' for Tailwind
      document.body.classList.add('dark')
    } else {
      root.classList.add('light-theme', 'light')
      document.body.classList.add('light')
    }
    
    // SOLUTION RADICALE : Appliquer directement les styles aux éléments
    setTimeout(() => {
      // Sélectionner tous les éléments qui doivent changer en mode sombre
      const selectors = [
        '.page-layout', '.dashboard-page', '[class*="pageLayout"]', '[class*="page-layout"]',
        '.content-container', '.contentContainer', '[class*="contentContainer"]', '[class*="content-container"]',
        '.page-container', '.pageContainer', '[class*="pageContainer"]', '[class*="page-container"]',
        '.page-content', '.pageContent', '[class*="pageContent"]', '[class*="page-content"]'
      ].join(', ');
      
      const elements = document.querySelectorAll(selectors);
      
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          if (theme === 'dark') {
            // Forcer le mode sombre directement
            el.style.setProperty('background-color', '#111827', 'important')
            el.style.setProperty('color', '#ffffff', 'important')
          } else {
            // Forcer le mode clair directement
            el.style.setProperty('background-color', '#f9f9f9', 'important')
            el.style.setProperty('color', '#333333', 'important')
          }
        }
      });
      
      // Vérifier si les styles ont été appliqués
      console.log(`${elements.length} éléments modifiés, thème actuel: ${theme}`)
    }, 50) // Petit délai pour s'assurer que le DOM est complètement chargé
  }, [theme])

  return children
} 