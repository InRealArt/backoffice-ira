'use server'

import { prisma } from '@/lib/prisma'
import { Faq } from '@prisma/client'
import { revalidatePath } from 'next/cache'


/**
 * Supprime un DetailedGlossaryHeader et tous ses DetailedGlossaryItem associés
 * @param id ID du DetailedGlossaryHeader à supprimer
 * @returns Objet contenant le statut de l'opération et un message éventuel
 */
export async function deleteDetailedGlossaryHeader(id: number) {
    try {
        // Supprimer d'abord tous les DetailedGlossaryItems associés
        await prisma.detailedGlossaryItem.deleteMany({
            where: {
                detailedGlossaryId: id,
            },
        })

        // Puis supprimer le DetailedGlossaryHeader
        await prisma.detailedGlossaryHeader.delete({
            where: {
                id,
            },
        })

        // Revalider le chemin pour que les changements soient visibles
        revalidatePath('/landing/detailedGlossary')

        return {
            success: true,
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du DetailedGlossaryHeader:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression',
        }
    }
}

/**
 * Crée un nouveau DetailedGlossaryHeader
 * @param name Nom du DetailedGlossaryHeader
 * @returns Objet contenant le statut de l'opération et un message éventuel
 */
export async function createDetailedGlossaryHeader(name: string) {
    try {
        const newHeader = await prisma.detailedGlossaryHeader.create({
            data: {
                name,
            },
        })

        // Revalider le chemin pour que les changements soient visibles
        revalidatePath('/landing/detailedGlossary')

        return {
            success: true,
            data: newHeader,
        }
    } catch (error) {
        console.error('Erreur lors de la création du DetailedGlossaryHeader:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la création',
        }
    }
}

/**
 * Met à jour un DetailedGlossaryHeader existant
 * @param id ID du DetailedGlossaryHeader à mettre à jour
 * @param name Nouveau nom du DetailedGlossaryHeader
 * @returns Objet contenant le statut de l'opération et un message éventuel
 */
export async function updateDetailedGlossaryHeader(id: number, name: string) {
    try {
        const updatedHeader = await prisma.detailedGlossaryHeader.update({
            where: {
                id,
            },
            data: {
                name,
            },
        })

        // Revalider le chemin pour que les changements soient visibles
        revalidatePath('/landing/detailedGlossary')
        revalidatePath(`/landing/detailedGlossary/${id}/edit`)

        return {
            success: true,
            data: updatedHeader,
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du DetailedGlossaryHeader:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour',
        }
    }
}

/**
 * Récupère tous les DetailedGlossaryHeader avec leurs DetailedGlossaryItem associés
 * @returns Liste des DetailedGlossaryHeader avec leurs glossaryItems
 */
export async function getDetailedGlossaryHeaders() {
    try {
        const glossaryHeaders = await prisma.detailedGlossaryHeader.findMany({
            orderBy: {
                id: 'asc',
            },
            include: {
                glossaryItems: true,
            },
        })

        return glossaryHeaders
    } catch (error) {
        console.error('Erreur lors de la récupération des Glossary détaillées:', error)
        return []
    }
}

/**
 * Crée un nouveau DetailedGlossaryItem associé à un DetailedGlossaryHeader
 * @param data Données du DetailedGlossaryItem à créer
 * @returns Objet contenant le statut de l'opération et un message éventuel
 */
export async function createDetailedGlossaryItem(data: {
    headerId: number,
    question: string,
    answer: string
}) {
    try {
        const newItem = await prisma.detailedGlossaryItem.create({
            data: {
                detailedGlossaryId: data.headerId,
                question: data.question,
                answer: data.answer
            }
        })

        // Revalider le chemin pour que les changements soient visibles
        revalidatePath('/landing/detailedGlossary')
        revalidatePath(`/landing/detailedGlossary/${data.headerId}/edit`)

        return {
            success: true,
            data: newItem
        }
    } catch (error) {
        console.error('Erreur lors de la création du DetailedGlossaryItem:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la création'
        }
    }
}

/**
 * Supprime un DetailedGlossaryItem
 * @param id ID du DetailedGlossaryItem à supprimer
 * @returns Objet contenant le statut de l'opération et un message éventuel
 */
export async function deleteDetailedGlossaryItem(id: number) {
    try {
        await prisma.detailedGlossaryItem.delete({
            where: {
                id
            }
        })

        // Revalider le chemin pour que les changements soient visibles
        revalidatePath('/landing/detailedGlossary')

        return {
            success: true
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du DetailedFaqItem:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression'
        }
    }
} 