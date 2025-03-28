'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Type pour les données de traduction
type TranslationData = {
    entityType: string
    entityId: number
    field: string
    value: string
    languageId: number
}

// Type pour les résultats d'action
type ActionResult = {
    success: boolean
    message?: string
    translation?: any
}

// Créer une nouvelle traduction
export async function createTranslation(data: TranslationData): Promise<ActionResult> {
    try {
        const { entityType, entityId, field, value, languageId } = data

        // Validation des données
        if (!entityType || !entityId || !field || !value || !languageId) {
            return { success: false, message: 'Tous les champs sont requis' }
        }

        // Vérifier si la langue existe
        const language = await prisma.language.findUnique({
            where: { id: languageId }
        })

        if (!language) {
            return { success: false, message: 'Langue non trouvée' }
        }

        // Vérifier si une traduction existe déjà pour cette combinaison
        const existingTranslation = await prisma.translation.findFirst({
            where: {
                entityType,
                entityId,
                field,
                languageId
            }
        })

        if (existingTranslation) {
            return {
                success: false,
                message: 'Une traduction existe déjà pour cette combinaison d\'entité, champ et langue'
            }
        }

        // Créer la traduction
        const translation = await prisma.translation.create({
            data: {
                entityType,
                entityId,
                field,
                value,
                languageId
            }
        })

        // Invalider le cache pour la page des traductions
        revalidatePath('/landing/translations')

        return { success: true, translation }
    } catch (error) {
        console.error('Erreur lors de la création de la traduction:', error)
        return { success: false, message: 'Erreur serveur' }
    }
}

// Mettre à jour une traduction existante
export async function updateTranslation(id: number, data: TranslationData): Promise<ActionResult> {
    try {
        // Vérifier si la traduction existe
        const existingTranslation = await prisma.translation.findUnique({
            where: { id }
        })

        if (!existingTranslation) {
            return { success: false, message: 'Traduction non trouvée' }
        }

        const { entityType, entityId, field, value, languageId } = data

        // Validation des données
        if (!entityType || !entityId || !field || !value || !languageId) {
            return { success: false, message: 'Tous les champs sont requis' }
        }

        // Vérifier si la langue existe
        const language = await prisma.language.findUnique({
            where: { id: languageId }
        })

        if (!language) {
            return { success: false, message: 'Langue non trouvée' }
        }

        // Vérifier si une autre traduction existe déjà pour cette combinaison (sauf celle-ci)
        const conflictingTranslation = await prisma.translation.findFirst({
            where: {
                entityType,
                entityId,
                field,
                languageId,
                id: { not: id }
            }
        })

        if (conflictingTranslation) {
            return {
                success: false,
                message: 'Une traduction existe déjà pour cette combinaison d\'entité, champ et langue'
            }
        }

        // Mettre à jour la traduction
        const updatedTranslation = await prisma.translation.update({
            where: { id },
            data: {
                entityType,
                entityId,
                field,
                value,
                languageId
            }
        })

        // Invalider le cache pour la page des traductions
        revalidatePath('/landing/translations')

        return { success: true, translation: updatedTranslation }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la traduction:', error)
        return { success: false, message: 'Erreur serveur' }
    }
}

// Supprimer une traduction
export async function deleteTranslation(id: number): Promise<ActionResult> {
    try {
        // Vérifier si la traduction existe
        const existingTranslation = await prisma.translation.findUnique({
            where: { id }
        })

        if (!existingTranslation) {
            return { success: false, message: 'Traduction non trouvée' }
        }

        // Supprimer la traduction
        await prisma.translation.delete({
            where: { id }
        })

        // Invalider le cache pour la page des traductions
        revalidatePath('/landing/translations')

        return { success: true, message: 'Traduction supprimée avec succès' }
    } catch (error) {
        console.error('Erreur lors de la suppression de la traduction:', error)
        return { success: false, message: 'Erreur serveur' }
    }
} 