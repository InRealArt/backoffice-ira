'use server'

import { prisma } from '@/lib/prisma'
import { Language } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getLanguageById(id: number): Promise<Language | null> {
    try {
        return await prisma.language.findUnique({
            where: { id }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de la langue:', error)
        return null
    }
}

export async function updateLanguage(
    id: number,
    data: Omit<Language, 'id'>
): Promise<{ success: boolean; message?: string }> {
    try {
        // Si cette langue devient la langue par défaut, réinitialiser le statut des autres langues
        if (data.isDefault) {
            await prisma.language.updateMany({
                where: {
                    id: {
                        not: id
                    }
                },
                data: {
                    isDefault: false
                }
            })
        }

        await prisma.language.update({
            where: { id },
            data
        })

        revalidatePath(`/landing/languages`)
        revalidatePath(`/landing/languages/${id}/edit`)

        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de la langue:', error)

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

export async function createLanguage(
    data: Omit<Language, 'id'>
): Promise<{ success: boolean; language?: Language; message?: string }> {
    try {
        // Si cette langue devient la langue par défaut, réinitialiser le statut des autres langues
        if (data.isDefault) {
            await prisma.language.updateMany({
                where: {},
                data: {
                    isDefault: false
                }
            })
        }

        const language = await prisma.language.create({
            data
        })

        revalidatePath(`/landing/languages`)

        return {
            success: true,
            language
        }
    } catch (error: any) {
        console.error('Erreur lors de la création de la langue:', error)

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

export async function deleteLanguage(
    id: number
): Promise<{ success: boolean; message?: string }> {
    try {
        // Vérifier si la langue est utilisée par des traductions
        const translationsUsingLanguage = await prisma.translation.count({
            where: { languageId: id }
        })

        if (translationsUsingLanguage > 0) {
            return {
                success: false,
                message: `Cette langue est utilisée par ${translationsUsingLanguage} traduction(s). Veuillez d'abord supprimer ces traductions.`
            }
        }

        // Vérifier si c'est la langue par défaut
        const language = await prisma.language.findUnique({
            where: { id }
        })

        if (language?.isDefault) {
            return {
                success: false,
                message: 'Vous ne pouvez pas supprimer la langue par défaut. Veuillez d\'abord définir une autre langue comme langue par défaut.'
            }
        }

        await prisma.language.delete({
            where: { id }
        })

        revalidatePath(`/landing/languages`)

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression de la langue:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression.'
        }
    }
} 