'use client'

import { useSessionRole } from './useSessionRole'
import { BackofficeUserRoles } from '@/lib/types/roles'

interface UseGalleryLjManagerResult {
  isGalleryLjManager: boolean
  isLoading: boolean
  error: string | null
}

/**
 * Indique si l'utilisateur connecté a le rôle galleryLjManager.
 * Symétrique de useIsAdmin — ne fusionne jamais avec les droits admin.
 * Dérivé de la session (pas d'appel serveur).
 */
export function useGalleryLjManager(): UseGalleryLjManagerResult {
  const { role, isLoading } = useSessionRole()
  return {
    isGalleryLjManager: role === BackofficeUserRoles.galleryLjManager,
    isLoading,
    error: null,
  }
}
