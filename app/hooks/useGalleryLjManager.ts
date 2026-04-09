'use client'

import { useState, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { getUserRole } from '@/lib/actions/auth-actions'
import { BackofficeUserRoles } from '@/lib/types/roles'

interface UseGalleryLjManagerResult {
  isGalleryLjManager: boolean
  isLoading: boolean
  error: string | null
}

/**
 * Hook to check if the connected user has the galleryLjManager role.
 * Symmetric to useIsAdmin — never merges with admin rights.
 */
export function useGalleryLjManager(): UseGalleryLjManagerResult {
  const [isGalleryLjManager, setIsGalleryLjManager] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session, isPending } = authClient.useSession()
  const user = session?.user
  const isLoggedIn = !!session

  useEffect(() => {
    let isMounted = true

    if (!isLoggedIn || !user || isPending) {
      setIsGalleryLjManager(false)
      setIsLoading(isPending)
      setError(null)
      return
    }

    const verifyRole = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const role = await getUserRole(user.email ?? '')

        if (!isMounted) return

        setIsGalleryLjManager(role === BackofficeUserRoles.galleryLjManager)
      } catch (err) {
        if (!isMounted) return
        console.error('Error in useGalleryLjManager:', err)
        setError((err as Error).message)
        setIsGalleryLjManager(false)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    verifyRole()

    return () => {
      isMounted = false
    }
  }, [isLoggedIn, user?.email, isPending])

  return { isGalleryLjManager, isLoading, error }
}
