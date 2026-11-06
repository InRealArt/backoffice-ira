'use client'

import { useSessionRole } from './useSessionRole'

interface UseIsAdminResult {
    isAdmin: boolean
    isLoading: boolean
    error: string | null
}

/**
 * Indique si l'utilisateur connecté est administrateur.
 * Dérivé de la session (pas d'appel serveur) : seul l'état de chargement de la session compte.
 */
export function useIsAdmin(): UseIsAdminResult {
    const { role, isLoading } = useSessionRole()
    return { isAdmin: role === 'admin', isLoading, error: null }
}
