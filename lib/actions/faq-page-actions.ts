'use server'

import { prisma } from '@/lib/prisma'
import { DetailedFaqPage, DetailedFaqPageItem, LandingPage } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { unstable_noStore } from 'next/cache'

/**
 * Récupère tous les DetailedFaqPage avec leurs DetailedFaqPageItem associés
 * @returns Liste des DetailedFaqPage avec leurs faqItems
 */
export async function getDetailedFaqPages() {
    // Empêcher la mise en cache de cette requête
    unstable_noStore()

    try {
        const faqPages = await prisma.detailedFaqPage.findMany({
            orderBy: {
                id: 'asc',
            },
            include: {
                faqItems: {
                    orderBy: {
                        order: 'asc'
                    }
                },
            },
        })

        return faqPages
    } catch (error) {
        console.error('Erreur lors de la récupération des FAQ par page:', error)
        return []
    }
}

/**
 * Récupère un DetailedFaqPage spécifique avec ses DetailedFaqPageItem associés
 * @param id ID du DetailedFaqPage à récupérer
 * @returns DetailedFaqPage avec ses faqItems ou null si non trouvé
 */
export async function getDetailedFaqPageById(id: number) {
    // Empêcher la mise en cache de cette requête
    unstable_noStore()

    try {
        return await prisma.detailedFaqPage.findUnique({
            where: { id },
            include: {
                faqItems: {
                    orderBy: {
                        order: 'asc'
                    }
                },
            },
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de la FAQ par page:', error)
        return null
    }
}

/**
 * Récupère la liste des valeurs de l'enum LandingPage qui ne sont pas déjà utilisées
 * @returns Liste des valeurs de LandingPage disponibles
 */
export async function getAvailableLandingPages() {
    try {
        // Récupérer toutes les valeurs de l'enum LandingPage
        const allLandingPages = Object.values(LandingPage)

        // Récupérer les pages déjà utilisées
        const usedPages = await prisma.detailedFaqPage.findMany({
            select: {
                name: true,
            },
        })

        // Extraire les noms des pages utilisées
        const usedPageNames = usedPages.map(page => page.name.toString())

        // Filtrer pour obtenir les pages disponibles
        const availablePages = allLandingPages.filter(
            page => !usedPageNames.includes(page.toString())
        )
        console.log("availablePages : ")
        return availablePages
    } catch (error) {
        console.error('Erreur lors de la récupération des pages disponibles:', error)
        return []
    }
}

/**
 * Crée un nouveau DetailedFaqPage
 * @param name Nom du DetailedFaqPage (valeur de l'enum LandingPage)
 * @returns Objet contenant le statut de l'opération et un message éventuel
 */
export async function createDetailedFaqPage(name: LandingPage) {
    try {
        // Vérifier si une FAQ existe déjà pour cette page
        const existingFaqPage = await prisma.detailedFaqPage.findFirst({
            where: {
                name,
            },
        })

        if (existingFaqPage) {
            return {
                success: false,
                message: 'Une FAQ existe déjà pour cette page',
            }
        }

        const newFaqPage = await prisma.detailedFaqPage.create({
            data: {
                name,
            },
        })

        // Revalider le chemin pour que les changements soient visibles
        revalidatePath('/landing/detailedFaqPage')

        return {
            success: true,
            data: newFaqPage,
        }
    } catch (error) {
        console.error('Erreur lors de la création de la FAQ par page:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la création',
        }
    }
}

/**
 * Supprime un DetailedFaqPage et tous ses DetailedFaqPageItem associés
 * @param id ID du DetailedFaqPage à supprimer
 * @returns Objet contenant le statut de l'opération et un message éventuel
 */
export async function deleteDetailedFaqPage(id: number) {
    try {
        // Supprimer d'abord tous les DetailedFaqPageItems associés
        await prisma.detailedFaqPageItem.deleteMany({
            where: {
                detailedFaqPageId: id,
            },
        })

        // Puis supprimer le DetailedFaqPage
        await prisma.detailedFaqPage.delete({
            where: {
                id,
            },
        })

        // Revalider le chemin pour que les changements soient visibles
        revalidatePath('/landing/detailedFaqPage')

        return {
            success: true,
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de la FAQ par page:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression',
        }
    }
}

/**
 * Récupère l'ordre maximum actuel pour les items d'une page spécifique
 * @param pageId ID de la page
 * @returns Ordre maximum + 1 ou 1 si aucun item n'existe
 */
export async function getMaxOrderForPage(pageId: number): Promise<number> {
    try {
        const maxOrderItem = await prisma.detailedFaqPageItem.findFirst({
            where: {
                detailedFaqPageId: pageId
            },
            orderBy: {
                order: 'desc'
            },
            select: {
                order: true
            }
        })

        return maxOrderItem ? maxOrderItem.order + 1 : 1
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'ordre maximum:', error)
        return 1
    }
}

/**
 * Crée un nouveau DetailedFaqPageItem associé à un DetailedFaqPage
 * @param data Données du DetailedFaqPageItem à créer
 * @returns Objet contenant le statut de l'opération et un message éventuel
 */
export async function createDetailedFaqPageItem(data: {
    pageId: number,
    question: string,
    answer: string,
    order?: number
}) {
    try {
        // Si l'ordre n'est pas fourni, obtenir le prochain ordre disponible
        const order = data.order || await getMaxOrderForPage(data.pageId)

        const newItem = await prisma.detailedFaqPageItem.create({
            data: {
                detailedFaqPageId: data.pageId,
                question: data.question,
                answer: data.answer,
                order: order
            }
        })

        // Revalider le chemin pour que les changements soient visibles
        revalidatePath('/landing/detailedFaqPage')
        revalidatePath(`/landing/detailedFaqPage/${data.pageId}/edit`)

        return {
            success: true,
            data: newItem
        }
    } catch (error) {
        console.error('Erreur lors de la création du DetailedFaqPageItem:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la création'
        }
    }
}

/**
 * Met à jour un DetailedFaqPageItem existant
 * @param id ID de l'item à mettre à jour
 * @param data Données à mettre à jour
 * @returns Objet contenant le statut de l'opération et un message éventuel
 */
export async function updateDetailedFaqPageItem(id: number, data: {
    question?: string,
    answer?: string,
    order?: number
}) {
    try {
        // Récupérer l'item pour connaître son pageId
        const item = await prisma.detailedFaqPageItem.findUnique({
            where: { id },
            select: { detailedFaqPageId: true }
        })

        if (!item) {
            return {
                success: false,
                message: 'Question non trouvée'
            }
        }

        // Mettre à jour l'item
        const updatedItem = await prisma.detailedFaqPageItem.update({
            where: { id },
            data
        })

        // Revalider les chemins
        revalidatePath('/landing/detailedFaqPage')
        revalidatePath(`/landing/detailedFaqPage/${item.detailedFaqPageId}/edit`)

        return {
            success: true,
            data: updatedItem
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du DetailedFaqPageItem:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour'
        }
    }
}

/**
 * Supprime un DetailedFaqPageItem
 * @param id ID du DetailedFaqPageItem à supprimer
 * @returns Objet contenant le statut de l'opération et un message éventuel
 */
export async function deleteDetailedFaqPageItem(id: number) {
    try {
        // Récupérer l'item pour connaître son pageId
        const item = await prisma.detailedFaqPageItem.findUnique({
            where: { id },
            select: { detailedFaqPageId: true }
        })

        if (!item) {
            return {
                success: false,
                message: 'Question non trouvée'
            }
        }

        // Supprimer l'item
        await prisma.detailedFaqPageItem.delete({
            where: { id }
        })

        // Revalider les chemins
        revalidatePath('/landing/detailedFaqPage')
        revalidatePath(`/landing/detailedFaqPage/${item.detailedFaqPageId}/edit`)

        return {
            success: true
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du DetailedFaqPageItem:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression'
        }
    }
} 