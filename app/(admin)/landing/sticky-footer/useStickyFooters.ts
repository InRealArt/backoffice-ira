'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/Toast/ToastContext'
import { deleteStickyFooter } from '@/lib/actions/sticky-footer-actions'

interface StickyFooterProps {
    id: number
    activeOnAllPages: boolean
    activeOnSpecificPages: boolean
    specificPages: string[]
    endValidityDate?: Date | null
    title?: string | null
    text?: string | null
    textButton?: string | null
    buttonUrl?: string | null
}

interface UseStickyFootersProps {
    initialStickyFooters: StickyFooterProps[] | undefined
}

export function useStickyFooters({ initialStickyFooters }: UseStickyFootersProps) {
    const router = useRouter()
    const [stickyFooters, setStickyFooters] = useState<StickyFooterProps[] | undefined>(initialStickyFooters)
    const [loadingStickyFooterId, setLoadingStickyFooterId] = useState<number | null>(null)
    const [deletingStickyFooterId, setDeletingStickyFooterId] = useState<number | null>(null)
    const { success, error } = useToast()

    // Synchroniser avec les nouvelles props
    useEffect(() => {
        setStickyFooters(initialStickyFooters)
    }, [initialStickyFooters])

    const navigateToEdit = useCallback((stickyFooterId: number) => {
        setLoadingStickyFooterId(stickyFooterId)
        router.push(`/landing/sticky-footer/${stickyFooterId}/edit`)
    }, [router])

    const navigateToCreate = useCallback(() => {
        router.push(`/landing/sticky-footer/create`)
    }, [router])

    const deleteStickyFooterAction = useCallback(async (stickyFooterId: number) => {
        if (!stickyFooters) return false

        setDeletingStickyFooterId(stickyFooterId)

        try {
            const result = await deleteStickyFooter(stickyFooterId)

            if (result.success) {
                // Mise à jour optimiste
                setStickyFooters(prevStickyFooters =>
                    prevStickyFooters?.filter(stickyFooter => stickyFooter.id !== stickyFooterId)
                )
                success('Sticky footer supprimé avec succès')

                // Forcer le rafraîchissement immédiat
                router.refresh()

                // Rediriger vers la liste des sticky footers après un court délai
                setTimeout(() => {
                    router.push('/landing/sticky-footer')
                }, 500)
                return true
            } else {
                error(result.message || 'Une erreur est survenue lors de la suppression')
                return false
            }
        } catch (error: any) {
            console.error('Erreur lors de la suppression:', error)
            error('Une erreur est survenue lors de la suppression')

            // Restaurer l'état en cas d'erreur
            router.refresh()
            return false
        } finally {
            setDeletingStickyFooterId(null)
        }
    }, [stickyFooters, router])

    const refreshStickyFooters = useCallback(async () => {
        try {
            // Forcer le rafraîchissement côté serveur
            router.refresh()
        } catch (error) {
            console.error('Erreur lors du rafraîchissement:', error)
        }
    }, [router])

    const forceRefreshStickyFooters = useCallback(async () => {
        try {
            // Recharger la page complètement pour s'assurer de la synchronisation parfaite
            window.location.reload()
        } catch (error) {
            console.error('Erreur lors du rechargement forcé:', error)
        }
    }, [])

    return {
        stickyFooters,
        loadingStickyFooterId,
        deletingStickyFooterId,
        navigateToEdit,
        navigateToCreate,
        deleteStickyFooter: deleteStickyFooterAction,
        refreshStickyFooters,
        forceRefreshStickyFooters,
        isLoading: loadingStickyFooterId !== null || deletingStickyFooterId !== null
    }
}
