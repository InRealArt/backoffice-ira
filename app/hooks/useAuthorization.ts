'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { checkAuthorizedUser } from '@/lib/actions/auth-actions'

interface UseAuthorizationOptions {
    /**
     * Rediriger automatiquement vers /dashboard si autorisé
     * @default false
     */
    redirectIfAuthorized?: boolean
    /**
     * Rediriger vers / si non autorisé
     * @default false
     */
    redirectIfUnauthorized?: boolean
    /**
     * Chemin de redirection si autorisé (par défaut: /dashboard)
     * @default '/dashboard'
     */
    redirectPath?: string
    /**
     * Désactiver la vérification automatique (pour contrôle manuel)
     * @default false
     */
    disabled?: boolean
}

interface UseAuthorizationResult {
    /**
     * True si l'utilisateur est autorisé, false si non autorisé, null si en cours de vérification ou non connecté
     */
    isAuthorized: boolean | null
    /**
     * True si la vérification est en cours
     */
    isLoading: boolean
    /**
     * Erreur éventuelle lors de la vérification
     */
    error: Error | null
    /**
     * Fonction pour forcer une nouvelle vérification
     */
    recheck: () => Promise<void>
}

// Cache global pour éviter les appels multiples
const authorizationCache = new Map<string, {
    result: boolean
    timestamp: number
    promise?: Promise<boolean>
}>()

// Durée de validité du cache (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// Promesses en cours pour éviter les appels simultanés
const pendingChecks = new Map<string, Promise<boolean>>()

/**
 * Hook personnalisé pour gérer l'autorisation utilisateur avec cache et déduplication
 * 
 * Ce hook:
 * - Évite les appels multiples simultanés pour le même email
 * - Utilise un cache côté client pour éviter les appels répétés
 * - Gère automatiquement les redirections si configuré
 * - Optimise les re-renders avec useMemo et useCallback
 * 
 * @param options - Options de configuration
 * @returns État d'autorisation et fonctions utilitaires
 */
export function useAuthorization(
    options: UseAuthorizationOptions = {}
): UseAuthorizationResult {
    const {
        redirectIfAuthorized = false,
        redirectIfUnauthorized = false,
        redirectPath = '/dashboard',
        disabled = false
    } = options

    const { data: session, isPending: isSessionPending } = authClient.useSession()
    const router = useRouter()
    const pathname = usePathname()

    const userEmail = session?.user?.email
    const isLoggedIn = !!session

    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [hasRedirected, setHasRedirected] = useState(false)

    // Utiliser useRef pour les callbacks afin d'éviter les re-renders
    const routerRef = useRef(router)
    const pathnameRef = useRef(pathname)
    const hasRedirectedRef = useRef(false)

    // Mettre à jour les refs sans causer de re-render
    useEffect(() => {
        routerRef.current = router
        pathnameRef.current = pathname
        hasRedirectedRef.current = hasRedirected
    }, [router, pathname, hasRedirected])

    /**
     * Fonction de vérification avec cache et déduplication
     */
    const checkAuthorization = useCallback(async (email: string, force = false): Promise<boolean> => {
        const cacheKey = email.toLowerCase()

        // Vérifier le cache si pas de force
        if (!force) {
            const cached = authorizationCache.get(cacheKey)
            if (cached) {
                const age = Date.now() - cached.timestamp
                if (age < CACHE_DURATION) {
                    return cached.result
                }
                // Cache expiré, le supprimer
                authorizationCache.delete(cacheKey)
            }

            // Vérifier si une vérification est déjà en cours
            const pending = pendingChecks.get(cacheKey)
            if (pending) {
                return pending
            }
        }

        // Créer une nouvelle promesse de vérification
        const checkPromise = (async () => {
            try {
                const result = await checkAuthorizedUser(email)
                const authorized = result.authorized

                // Mettre à jour le cache
                authorizationCache.set(cacheKey, {
                    result: authorized,
                    timestamp: Date.now()
                })

                // Nettoyer la promesse en cours
                pendingChecks.delete(cacheKey)

                return authorized
            } catch (err) {
                pendingChecks.delete(cacheKey)
                throw err
            }
        })()

        // Stocker la promesse en cours
        if (!force) {
            pendingChecks.set(cacheKey, checkPromise)
        }

        return checkPromise
    }, [])

    /**
     * Fonction pour forcer une nouvelle vérification
     */
    const recheck = useCallback(async () => {
        if (!userEmail) return

        // Invalider le cache
        authorizationCache.delete(userEmail.toLowerCase())
        pendingChecks.delete(userEmail.toLowerCase())

        setIsLoading(true)
        setError(null)

        try {
            const authorized = await checkAuthorization(userEmail, true)
            setIsAuthorized(authorized)
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Erreur inconnue')
            setError(error)
            setIsAuthorized(false)
        } finally {
            setIsLoading(false)
        }
    }, [userEmail, checkAuthorization])

    // Effet principal pour vérifier l'autorisation
    useEffect(() => {
        // Ne rien faire si désactivé ou si la session est en cours de chargement
        if (disabled || isSessionPending) {
            return
        }

        // Réinitialiser si l'utilisateur se déconnecte
        if (!isLoggedIn || !userEmail) {
            setIsAuthorized(null)
            setIsLoading(false)
            setError(null)
            hasRedirectedRef.current = false
            setHasRedirected(false)
            return
        }

        // Vérifier l'autorisation
        let isMounted = true

        const performCheck = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const authorized = await checkAuthorization(userEmail)

                if (!isMounted) return

                setIsAuthorized(authorized)
                setIsLoading(false)

                // Gérer les redirections
                if (authorized && redirectIfAuthorized && !hasRedirectedRef.current && pathnameRef.current !== redirectPath) {
                    hasRedirectedRef.current = true
                    setHasRedirected(true)
                    routerRef.current.push(redirectPath)
                } else if (!authorized && redirectIfUnauthorized && !hasRedirectedRef.current && pathnameRef.current !== '/') {
                    hasRedirectedRef.current = true
                    setHasRedirected(true)
                    routerRef.current.push('/')
                }
            } catch (err) {
                if (!isMounted) return

                const error = err instanceof Error ? err : new Error('Erreur lors de la vérification')
                setError(error)
                setIsAuthorized(false)
                setIsLoading(false)
            }
        }

        performCheck()

        return () => {
            isMounted = false
        }
    }, [
        disabled,
        isLoggedIn,
        userEmail,
        isSessionPending,
        redirectIfAuthorized,
        redirectIfUnauthorized,
        redirectPath,
        checkAuthorization
    ])

    // Nettoyer le cache périodiquement
    useEffect(() => {
        const cleanup = setInterval(() => {
            const now = Date.now()
            for (const [key, value] of authorizationCache.entries()) {
                if (now - value.timestamp > CACHE_DURATION) {
                    authorizationCache.delete(key)
                }
            }
        }, 60000) // Nettoyer toutes les minutes

        return () => clearInterval(cleanup)
    }, [])

    return useMemo(
        () => ({
            isAuthorized,
            isLoading,
            error,
            recheck
        }),
        [isAuthorized, isLoading, error, recheck]
    )
}


