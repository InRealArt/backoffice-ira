'use client'

import { useState, useEffect } from 'react'
import { useIsLoggedIn, useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { checkIsAdmin } from '@/app/actions/prisma/prismaActions'

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
    const isLoggedIn = useIsLoggedIn()
    const { user, primaryWallet } = useDynamicContext()

    useEffect(() => {
        // Réinitialiser les états lorsque l'utilisateur n'est pas connecté
        if (!isLoggedIn || !user) {
            setIsAdmin(false)
            setIsLoading(false)
            setError(null)
            return
        }

        const verifyAdminRole = async () => {
            setIsLoading(true)
            setError(null)

            try {
                // Appel du Server Action au lieu de faire un fetch
                const result = await checkIsAdmin(
                    user.email || null,
                    primaryWallet?.address || null
                )

                if (result.error) {
                    throw new Error(result.error)
                }

                setIsAdmin(result.isAdmin)
            } catch (err) {
                console.error('Erreur dans useIsAdmin:', err)
                setError((err as Error).message)
                setIsAdmin(false)
            } finally {
                setIsLoading(false)
            }
        }

        verifyAdminRole()
    }, [isLoggedIn, user, primaryWallet])

    return { isAdmin, isLoading, error }
} 