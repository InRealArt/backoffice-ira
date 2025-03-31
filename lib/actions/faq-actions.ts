'use server'

import { prisma } from '@/lib/prisma'
import { Faq } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getFaqById(id: number): Promise<Faq | null> {
    try {
        return await prisma.faq.findUnique({
            where: { id }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de la FAQ:', error)
        return null
    }
}

export async function updateFaq(
    id: number,
    data: Omit<Faq, 'id'>
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.faq.update({
            where: { id },
            data
        })

        revalidatePath(`/landing/faq`)
        revalidatePath(`/landing/faq/${id}/edit`)

        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de la FAQ:', error)

        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'Un champ'
            return {
                success: false,
                message: `${field} est déjà utilisé. Veuillez en choisir un autre.`
            }
        }

        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour.'
        }
    }
}

export async function createFaq(
    data: Omit<Faq, 'id'>
): Promise<{ success: boolean; faq?: Faq; message?: string }> {
    try {
        const faq = await prisma.faq.create({
            data
        })

        revalidatePath(`/landing/faq`)

        return {
            success: true,
            faq
        }
    } catch (error: any) {
        console.error('Erreur lors de la création de la FAQ:', error)

        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'Un champ'
            return {
                success: false,
                message: `${field} est déjà utilisé. Veuillez en choisir un autre.`
            }
        }

        return {
            success: false,
            message: 'Une erreur est survenue lors de la création.'
        }
    }
}

export async function deleteFaq(
    id: number
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.faq.delete({
            where: { id }
        })

        revalidatePath(`/landing/faq`)

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression de la FAQ:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression.'
        }
    }
}


/**
 * Supprime un DetailedFaqHeader et tous ses DetailedFaqItem associés
 * @param id ID du DetailedFaqHeader à supprimer
 * @returns Objet contenant le statut de l'opération et un message éventuel
 */
export async function deleteDetailedFaqHeader(id: number) {
    try {
        // Suppression en cascade (supprime également tous les DetailedFaqItem associés)
        await prisma.detailedFaqHeader.delete({
            where: {
                id,
            },
        })

        // Revalider le chemin pour que les changements soient visibles
        revalidatePath('/landing/detailedFaq')

        return {
            success: true,
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du DetailedFaqHeader:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression',
        }
    }
}

/**
 * Crée un nouveau DetailedFaqHeader
 * @param name Nom du DetailedFaqHeader
 * @returns Objet contenant le statut de l'opération et un message éventuel
 */
export async function createDetailedFaqHeader(name: string) {
    try {
        const newHeader = await prisma.detailedFaqHeader.create({
            data: {
                name,
            },
        })

        // Revalider le chemin pour que les changements soient visibles
        revalidatePath('/landing/detailedFaq')

        return {
            success: true,
            data: newHeader,
        }
    } catch (error) {
        console.error('Erreur lors de la création du DetailedFaqHeader:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la création',
        }
    }
}

/**
 * Met à jour un DetailedFaqHeader existant
 * @param id ID du DetailedFaqHeader à mettre à jour
 * @param name Nouveau nom du DetailedFaqHeader
 * @returns Objet contenant le statut de l'opération et un message éventuel
 */
export async function updateDetailedFaqHeader(id: number, name: string) {
    try {
        const updatedHeader = await prisma.detailedFaqHeader.update({
            where: {
                id,
            },
            data: {
                name,
            },
        })

        // Revalider le chemin pour que les changements soient visibles
        revalidatePath('/landing/detailedFaq')
        revalidatePath(`/landing/detailedFaq/${id}/edit`)

        return {
            success: true,
            data: updatedHeader,
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du DetailedFaqHeader:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour',
        }
    }
}

/**
 * Récupère tous les DetailedFaqHeader avec leurs DetailedFaqItem associés
 * @returns Liste des DetailedFaqHeader avec leurs faqItems
 */
export async function getDetailedFaqHeaders() {
    try {
        const faqHeaders = await prisma.detailedFaqHeader.findMany({
            orderBy: {
                id: 'asc',
            },
            include: {
                faqItems: true,
            },
        })

        return faqHeaders
    } catch (error) {
        console.error('Erreur lors de la récupération des FAQ détaillées:', error)
        return []
    }
} 