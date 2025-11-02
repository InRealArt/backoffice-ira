'use client'

import { useState, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { checkIsAdmin } from '@/lib/actions/auth-actions'

interface UseIsAdminResult {
    isAdmin: boolean
    isLoading: boolean
    error: string | null
}

/**
 * Hook personnalisé pour vérifier si l'utilisateur connecté est un administrateur
 * @returns Un objet contenant isAdmin, isLoading et error
 */
export function useIsAdmin(): UseIsAdminResult {
    const [isAdmin, setIsAdmin] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const { data: session, isPending } = authClient.useSession()
    const user = session?.user
    const isLoggedIn = !!session

    useEffect(() => {
        let isMounted = true

        // Réinitialiser les états lorsque l'utilisateur n'est pas connecté
        if (!isLoggedIn || !user || isPending) {
            setIsAdmin(false)
            setIsLoading(isPending)
            setError(null)
            return
        }

        const verifyAdminRole = async () => {
            setIsLoading(true)
            setError(null)

            const userEmail = user.email

            try {
                // Appel du Server Action pour vérifier le rôle admin
                const result = await checkIsAdmin(userEmail || '')

                if (!isMounted) return

                setIsAdmin(result)
            } catch (err) {
                if (!isMounted) return
                console.error('Erreur dans useIsAdmin:', err)
                setError((err as Error).message)
                setIsAdmin(false)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        verifyAdminRole()

        return () => {
            isMounted = false
        }
    }, [isLoggedIn, user?.email, isPending]) // Utiliser user?.email au lieu de user pour stabiliser

    return { isAdmin, isLoading, error }
} 