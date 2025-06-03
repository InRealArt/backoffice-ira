'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { ArtworkTechnique } from '@prisma/client'
import { Prisma } from '@prisma/client'

export interface ArtworkTechniqueFormData {
    name: string
}

export interface ActionResult {
    success: boolean
    message: string
    id?: number
}

// Fonction pour récupérer toutes les techniques d'œuvre (pour le composant server)
export async function getAllArtworkTechniques(): Promise<ArtworkTechnique[]> {
    try {
        const artworkTechniques = await prisma.artworkTechnique.findMany({
            orderBy: {
                name: 'asc',
            },
        })
        return artworkTechniques
    } catch (error) {
        console.error('Erreur lors de la récupération des techniques d\'œuvre:', error)
        return []
    }
}

// Créer une nouvelle technique d'œuvre
export async function createArtworkTechnique(data: ArtworkTechniqueFormData): Promise<ActionResult & { id?: number }> {
    try {
        const artworkTechnique = await prisma.artworkTechnique.create({
            data: {
                name: data.name.trim(),
            },
        })

        revalidatePath('/dataAdministration/artwork-techniques')

        return {
            success: true,
            message: 'Technique d\'œuvre créée avec succès',
            id: artworkTechnique.id,
        }
    } catch (error) {
        console.error('Erreur lors de la création de la technique d\'œuvre:', error)

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return {
                    success: false,
                    message: 'Une technique d\'œuvre avec ce nom existe déjà',
                }
            }
        }

        return {
            success: false,
            message: 'Erreur lors de la création de la technique d\'œuvre',
        }
    }
}

// Mettre à jour une technique d'œuvre existante
export async function updateArtworkTechnique(id: number, data: ArtworkTechniqueFormData): Promise<ActionResult> {
    try {
        await prisma.artworkTechnique.update({
            where: { id },
            data: {
                name: data.name.trim(),
            },
        })

        revalidatePath('/dataAdministration/artwork-techniques')
        revalidatePath(`/dataAdministration/artwork-techniques/${id}/edit`)

        return {
            success: true,
            message: 'Technique d\'œuvre mise à jour avec succès',
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la technique d\'œuvre:', error)

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return {
                    success: false,
                    message: 'Une technique d\'œuvre avec ce nom existe déjà',
                }
            }
            if (error.code === 'P2025') {
                return {
                    success: false,
                    message: 'Technique d\'œuvre introuvable',
                }
            }
        }

        return {
            success: false,
            message: 'Erreur lors de la mise à jour de la technique d\'œuvre',
        }
    }
}

// Supprimer une technique d'œuvre
export async function deleteArtworkTechnique(id: number): Promise<ActionResult> {
    try {
        await prisma.artworkTechnique.delete({
            where: { id },
        })

        revalidatePath('/dataAdministration/artwork-techniques')

        return {
            success: true,
            message: 'Technique d\'œuvre supprimée avec succès',
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de la technique d\'œuvre:', error)

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return {
                    success: false,
                    message: 'Technique d\'œuvre introuvable',
                }
            }
        }

        return {
            success: false,
            message: 'Erreur lors de la suppression de la technique d\'œuvre',
        }
    }
}

// Récupérer toutes les techniques d'œuvre (pour les composants client)
export async function getArtworkTechniques(): Promise<ArtworkTechnique[]> {
    try {
        const artworkTechniques = await prisma.artworkTechnique.findMany({
            orderBy: {
                name: 'asc',
            },
        })
        return artworkTechniques
    } catch (error) {
        console.error('Erreur lors de la récupération des techniques d\'œuvre:', error)
        return []
    }
}

// Récupérer une technique d'œuvre par ID
export async function getArtworkTechniqueById(id: number): Promise<ArtworkTechnique | null> {
    try {
        const artworkTechnique = await prisma.artworkTechnique.findUnique({
            where: { id },
        })
        return artworkTechnique
    } catch (error) {
        console.error('Erreur lors de la récupération de la technique d\'œuvre:', error)
        return null
    }
} 