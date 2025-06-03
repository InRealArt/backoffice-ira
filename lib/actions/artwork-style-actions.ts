'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { ArtworkStyle } from '@prisma/client'
import { Prisma } from '@prisma/client'

export interface ArtworkStyleFormData {
    name: string
}

export interface ActionResult {
    success: boolean
    message: string
    id?: number
}

// Fonction pour récupérer tous les styles d'œuvre (pour le composant server)
export async function getAllArtworkStyles(): Promise<ArtworkStyle[]> {
    try {
        const artworkStyles = await prisma.artworkStyle.findMany({
            orderBy: {
                name: 'asc',
            },
        })
        return artworkStyles
    } catch (error) {
        console.error('Erreur lors de la récupération des styles d\'œuvre:', error)
        return []
    }
}

// Créer un nouveau style d'œuvre
export async function createArtworkStyle(data: ArtworkStyleFormData): Promise<ActionResult & { id?: number }> {
    try {
        const artworkStyle = await prisma.artworkStyle.create({
            data: {
                name: data.name.trim(),
            },
        })

        revalidatePath('/dataAdministration/artwork-styles')

        return {
            success: true,
            message: 'Style d\'œuvre créé avec succès',
            id: artworkStyle.id,
        }
    } catch (error) {
        console.error('Erreur lors de la création du style d\'œuvre:', error)

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return {
                    success: false,
                    message: 'Un style d\'œuvre avec ce nom existe déjà',
                }
            }
        }

        return {
            success: false,
            message: 'Erreur lors de la création du style d\'œuvre',
        }
    }
}

// Mettre à jour un style d'œuvre existant
export async function updateArtworkStyle(id: number, data: ArtworkStyleFormData): Promise<ActionResult> {
    try {
        await prisma.artworkStyle.update({
            where: { id },
            data: {
                name: data.name.trim(),
            },
        })

        revalidatePath('/dataAdministration/artwork-styles')
        revalidatePath(`/dataAdministration/artwork-styles/${id}/edit`)

        return {
            success: true,
            message: 'Style d\'œuvre mis à jour avec succès',
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du style d\'œuvre:', error)

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return {
                    success: false,
                    message: 'Un style d\'œuvre avec ce nom existe déjà',
                }
            }
            if (error.code === 'P2025') {
                return {
                    success: false,
                    message: 'Style d\'œuvre introuvable',
                }
            }
        }

        return {
            success: false,
            message: 'Erreur lors de la mise à jour du style d\'œuvre',
        }
    }
}

// Supprimer un style d'œuvre
export async function deleteArtworkStyle(id: number): Promise<ActionResult> {
    try {
        await prisma.artworkStyle.delete({
            where: { id },
        })

        revalidatePath('/dataAdministration/artwork-styles')

        return {
            success: true,
            message: 'Style d\'œuvre supprimé avec succès',
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du style d\'œuvre:', error)

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return {
                    success: false,
                    message: 'Style d\'œuvre introuvable',
                }
            }
        }

        return {
            success: false,
            message: 'Erreur lors de la suppression du style d\'œuvre',
        }
    }
}

// Récupérer tous les styles d'œuvre (pour les composants client)
export async function getArtworkStyles(): Promise<ArtworkStyle[]> {
    try {
        const artworkStyles = await prisma.artworkStyle.findMany({
            orderBy: {
                name: 'asc',
            },
        })
        return artworkStyles
    } catch (error) {
        console.error('Erreur lors de la récupération des styles d\'œuvre:', error)
        return []
    }
}

// Récupérer un style d'œuvre par ID
export async function getArtworkStyleById(id: number): Promise<ArtworkStyle | null> {
    try {
        const artworkStyle = await prisma.artworkStyle.findUnique({
            where: { id },
        })
        return artworkStyle
    } catch (error) {
        console.error('Erreur lors de la récupération du style d\'œuvre:', error)
        return null
    }
} 