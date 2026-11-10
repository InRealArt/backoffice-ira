import { createAuthClient } from 'better-auth/react'
import { getClientBaseUrl } from './app-url'

export const authClient = createAuthClient({
    baseURL: getClientBaseUrl(),
    // Désactiver le polling automatique pour éviter les appels multiples
    fetchOptions: {
        credentials: 'include'
    }
})


