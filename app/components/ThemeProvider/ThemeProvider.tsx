'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/app/hooks/useThemeStore'

// Les couleurs des conteneurs de page viennent des tokens CSS (globals.css, styles/dark-theme.scss) :
// ce composant ne fait que poser les classes de thème sur <html> et <body>.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore()

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light-theme', 'dark-theme', 'dark', 'light')
    document.body.classList.remove('light', 'dark')

    if (theme === 'dark') {
      root.classList.add('dark-theme', 'dark') // 'dark' pour les variantes dark: de Tailwind
      document.body.classList.add('dark')
    } else {
      root.classList.add('light-theme', 'light')
      document.body.classList.add('light')
    }
  }, [theme])

  return children
}
