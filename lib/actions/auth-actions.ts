'use server'

import { prisma } from '@/lib/prisma'

export interface CheckAuthorizedUserResult {
    authorized: boolean
    message: string
}

/**
 * Fonction interne pour vérifier l'autorisation (utilisée côté serveur)
 * Note: Le cache est géré côté client par le hook useAuthorization
 * pour éviter les appels multiples et optimiser les performances
 */
async function getCachedAuthorization(email: string): Promise<CheckAuthorizedUserResult> {
    try {
        if (!email) {
            return {
                authorized: false,
                message: 'Email manquant'
            }
        }

        // Vérifier si l'email existe dans la table BackofficeAuthUser (Better Auth)
        const user = await prisma.backofficeAuthUser.findUnique({
            where: { email: email.toLowerCase() }
        })

        return {
            authorized: !!user,
            message: user ? 'Utilisateur autorisé' : 'Utilisateur non autorisé'
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'autorisation:', error)
        return {
            authorized: false,
            message: 'Erreur serveur'
        }
    }
}

/**
 * Vérifie si un utilisateur est autorisé à accéder au backoffice
 * Server Action pour être appelée depuis le client
 * @param email - Email de l'utilisateur à vérifier
 * @returns Résultat de la vérification
 */
export async function checkAuthorizedUser(email: string): Promise<CheckAuthorizedUserResult> {
    return getCachedAuthorization(email)
}

/**
 * Vérifie si un utilisateur est admin
 * @param email - Email de l'utilisateur à vérifier
 * @returns True si l'utilisateur est admin
 */
export async function checkIsAdmin(email: string): Promise<boolean> {
    try {
        if (!email) return false

        const user = await prisma.backofficeAuthUser.findUnique({
            where: { email: email.toLowerCase() },
            select: { role: true }
        })

        return user?.role === 'admin'
    } catch (error) {
        console.error('Erreur lors de la vérification admin:', error)
        return false
    }
}

/**
 * Récupère le rôle d'un utilisateur depuis la table BackofficeAuthUser
 * @param email - Email de l'utilisateur
 * @returns Le rôle de l'utilisateur ou null
 */
export async function getUserRole(email: string): Promise<string | null> {
    try {
        if (!email) return null

        const user = await prisma.backofficeAuthUser.findUnique({
            where: { email: email.toLowerCase() },
            select: { role: true }
        })

        return user?.role || null
    } catch (error) {
        console.error('Erreur lors de la récupération du rôle:', error)
        return null
    }
}

/**
 * Récupère les wallets liés d'un utilisateur
 * @param address - Adresse du wallet principal
 * @returns Wallets liés ou null
 */
export async function getLinkedWallets(address: string) {
    try {
        if (!address) {
            throw new Error('Adresse du portefeuille requise')
        }

        const user = await prisma.backofficeUser.findUnique({
            where: { walletAddress: address },
            select: { linkedWallets: true }
        })

        if (!user) {
            throw new Error('Utilisateur non trouvé')
        }

        return user.linkedWallets
    } catch (error) {
        console.error('Erreur lors de la récupération des wallets liés:', error)
        throw error
    }
}

/**
 * Vérifie si un utilisateur est présent dans la liste blanche
 * @param email - Email de l'utilisateur à vérifier
 * @returns WhiteListedUser si trouvé, null sinon
 */
export async function checkWhiteListedUser(email: string) {
    try {
        if (!email) {
            return null
        }

        const whiteListedUser = await prisma.whiteListedUser.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                email: true,
                role: true,
                artistId: true
            }
        })

        return whiteListedUser
    } catch (error) {
        console.error('Erreur lors de la vérification de la whitelist:', error)
        return null
    }
}

/**
 * Met à jour le rôle et l'artistId d'un utilisateur après signup
 * @param email - Email de l'utilisateur à mettre à jour
 * @param role - Rôle à assigner
 * @param artistId - ID de l'artiste à assigner (optionnel)
 * @returns True si la mise à jour a réussi
 */
export async function updateUserAfterSignup(
    email: string,
    role: string | null,
    artistId: number | null
): Promise<{ success: boolean; message: string }> {
    try {
        if (!email) {
            return {
                success: false,
                message: 'Email manquant'
            }
        }

        const normalizedEmail = email.toLowerCase()

        // Attendre un peu pour s'assurer que l'utilisateur est bien créé
        await new Promise(resolve => setTimeout(resolve, 100))

        // Vérifier d'abord si l'utilisateur existe
        let user = await prisma.backofficeAuthUser.findUnique({
            where: { email: normalizedEmail }
        })

        // Si l'utilisateur n'existe pas encore, attendre un peu plus et réessayer
        if (!user) {
            await new Promise(resolve => setTimeout(resolve, 200))
            user = await prisma.backofficeAuthUser.findUnique({
                where: { email: normalizedEmail }
            })
        }

        // Si toujours pas trouvé, essayer avec upsert pour créer/mettre à jour
        if (!user) {
            // Trouver le dernier utilisateur créé avec cet email (au cas où il y aurait un problème de timing)
            const users = await prisma.backofficeAuthUser.findMany({
                where: { email: { contains: normalizedEmail } },
                orderBy: { createdAt: 'desc' },
                take: 1
            })

            if (users.length === 0) {
                return {
                    success: false,
                    message: 'Utilisateur non trouvé dans la base de données'
                }
            }

            user = users[0]
        }

        // Maintenant mettre à jour avec l'ID trouvé
        // Valider et préparer les valeurs
        let finalRole: string | null | undefined = undefined
        let finalArtistId: number | null | undefined = undefined

        // Valider role
        if (role !== undefined && role !== null) {
            const validRoles = ['admin', 'artist', 'galleryManager']
            if (validRoles.includes(role)) {
                finalRole = role as any
            }
        } else if (role === null) {
            finalRole = null
        }

        // Valider artistId
        if (artistId !== undefined && artistId !== null) {
            const artistIdNum = typeof artistId === 'number' ? artistId : parseInt(String(artistId))
            if (!isNaN(artistIdNum) && artistIdNum > 0) {
                finalArtistId = artistIdNum
            }
        } else if (artistId === null) {
            finalArtistId = null
        }

        // Vérifier qu'on a au moins une valeur à mettre à jour
        if (finalRole === undefined && finalArtistId === undefined) {
            return {
                success: false,
                message: 'Aucune donnée valide à mettre à jour'
            }
        }

        // Utiliser $executeRaw avec Prisma template tags pour éviter les problèmes de trigger
        // Le problème est qu'un trigger PostgreSQL essaie d'accéder à new.updated_at
        // On utilise $executeRaw avec des template tags Prisma pour une injection SQL sûre
        if (finalRole !== undefined && finalArtistId !== undefined) {
            await prisma.$executeRaw`
                UPDATE backoffice."user" 
                SET role = ${finalRole}::text, "artistId" = ${finalArtistId}
                WHERE id = ${user.id}
            `
        } else if (finalRole !== undefined) {
            await prisma.$executeRaw`
                UPDATE backoffice."user" 
                SET role = ${finalRole}::text
                WHERE id = ${user.id}
            `
        } else if (finalArtistId !== undefined) {
            await prisma.$executeRaw`
                UPDATE backoffice."user" 
                SET "artistId" = ${finalArtistId}
                WHERE id = ${user.id}
            `
        }

        // Récupérer l'utilisateur mis à jour pour confirmation
        const updatedUser = await prisma.backofficeAuthUser.findUnique({
            where: { id: user.id }
        })

        if (!updatedUser) {
            return {
                success: false,
                message: 'Utilisateur non trouvé après la mise à jour'
            }
        }

        return {
            success: true,
            message: 'Utilisateur mis à jour avec succès'
        }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)

        // Si l'erreur est "utilisateur non trouvé" ou problème de colonne, essayer avec upsert
        if (error.code === 'P2025' || error.message?.includes('not found') || error.message?.includes('does not exist')) {
            try {
                const normalizedEmail = email.toLowerCase()

                // Préparer les valeurs validées
                let finalRole: string | null | undefined = undefined
                let finalArtistId: number | null | undefined = undefined

                // Valider role
                if (role !== undefined && role !== null) {
                    const validRoles = ['admin', 'artist', 'galleryManager']
                    if (validRoles.includes(role)) {
                        finalRole = role as any
                    }
                } else if (role === null) {
                    finalRole = null
                }

                // Valider artistId
                if (artistId !== undefined && artistId !== null) {
                    const artistIdNum = typeof artistId === 'number' ? artistId : parseInt(String(artistId))
                    if (!isNaN(artistIdNum) && artistIdNum > 0) {
                        finalArtistId = artistIdNum
                    }
                } else if (artistId === null) {
                    finalArtistId = null
                }

                // Construire createData de manière statique
                const createDataObj: {
                    id: string
                    email: string
                    name: string
                    emailVerified: boolean
                    role?: string | null
                    artistId?: number | null
                } = {
                    id: crypto.randomUUID(),
                    email: normalizedEmail,
                    name: '',
                    emailVerified: false
                }

                if (finalRole !== undefined) {
                    createDataObj.role = finalRole
                }
                if (finalArtistId !== undefined) {
                    createDataObj.artistId = finalArtistId
                }

                // Utiliser une transaction pour upsert avec SQL brut
                const updatedUser = await prisma.$transaction(async (tx) => {
                    // Vérifier si l'utilisateur existe
                    const existingUser = await tx.backofficeAuthUser.findUnique({
                        where: { email: normalizedEmail }
                    })

                    if (existingUser) {
                        // Utiliser $executeRaw avec Prisma template tags dans la transaction
                        if (finalRole !== undefined && finalArtistId !== undefined) {
                            await tx.$executeRaw`
                                UPDATE backoffice."user" 
                                SET role = ${finalRole}::text, "artistId" = ${finalArtistId}
                                WHERE id = ${existingUser.id}
                            `
                        } else if (finalRole !== undefined) {
                            await tx.$executeRaw`
                                UPDATE backoffice."user" 
                                SET role = ${finalRole}::text
                                WHERE id = ${existingUser.id}
                            `
                        } else if (finalArtistId !== undefined) {
                            await tx.$executeRaw`
                                UPDATE backoffice."user" 
                                SET "artistId" = ${finalArtistId}
                                WHERE id = ${existingUser.id}
                            `
                        }

                        // Récupérer l'utilisateur mis à jour
                        return await tx.backofficeAuthUser.findUnique({
                            where: { id: existingUser.id }
                        })
                    } else {
                        // Créer avec Prisma normal
                        return await tx.backofficeAuthUser.create({
                            data: createDataObj as any
                        })
                    }
                })

                return {
                    success: true,
                    message: 'Utilisateur créé/mis à jour avec succès'
                }
            } catch (upsertError) {
                console.error('Erreur lors de l\'upsert:', upsertError)
                return {
                    success: false,
                    message: 'Erreur lors de la création/mise à jour'
                }
            }
        }

        return {
            success: false,
            message: `Erreur lors de la mise à jour: ${error.message || 'Erreur inconnue'}`
        }
    }
}

/**
 * Supprime un utilisateur après un signup échoué (non whitelisté)
 * @param email - Email de l'utilisateur à supprimer
 */
export async function deleteUserAfterFailedSignup(email: string): Promise<void> {
    try {
        if (!email) {
            return
        }

        await prisma.backofficeAuthUser.delete({
            where: { email: email.toLowerCase() }
        })
    } catch (error) {
        // Ignorer les erreurs si l'utilisateur n'existe pas déjà
        console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    }
}

