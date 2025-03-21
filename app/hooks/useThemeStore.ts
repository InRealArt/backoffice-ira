'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
}

// Détection côté client sécurisée
const getDefaultTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light'

    // Vérifier s'il y a une préférence sauvegardée
    const savedTheme = localStorage.getItem('theme-storage')
    if (savedTheme) {
        try {
            const parsed = JSON.parse(savedTheme)
            if (parsed.state && parsed.state.theme) {
                return parsed.state.theme
            }
        } catch (e) {
            // Ignorer les erreurs de parsing
        }
    }

    // Utiliser la préférence système
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'light', // Valeur par défaut sécurisée pour SSR
            toggleTheme: () => set((state) => {
                const newTheme = state.theme === 'light' ? 'dark' : 'light'
                console.log('Basculement vers le thème:', newTheme)
                return { theme: newTheme }
            }),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => localStorage)
        }
    )
)

// Initialiser le thème après montage côté client
if (typeof window !== 'undefined') {
    // Définir le thème après hydratation
    const theme = getDefaultTheme()
    setTimeout(() => {
        useThemeStore.getState().setTheme(theme)
    }, 0)
} 