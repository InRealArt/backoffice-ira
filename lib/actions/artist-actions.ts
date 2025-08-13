'use server'

import { prisma } from '@/lib/prisma'
import { Artist, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getArtistById(id: number): Promise<Artist | null> {
    try {
        return await prisma.artist.findUnique({
            where: { id }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'artiste:', error)
        return null
    }
}

export async function updateArtist(
    id: number,
    data: Prisma.ArtistUpdateInput
): Promise<{ success: boolean; message?: string }> {
    try {
        // Mise à jour de l'artiste
        await prisma.artist.update({
            where: { id },
            data
        })

        revalidatePath(`/dataAdministration/artists`)
        revalidatePath(`/dataAdministration/artists/${id}/edit`)

        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de l\'artiste:', error)

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

export interface CreateArtistData {
    name: string
    surname: string
    pseudo: string
    description: string
    artworkStyle?: string | null
    artistsPage?: boolean
    publicKey?: string
    imageUrl?: string
    isGallery?: boolean
    backgroundImage?: string | null
}

/**
 * Crée un nouvel artiste
 */
export async function createArtist(data: CreateArtistData): Promise<{ success: boolean; message?: string; artist?: Artist }> {
    try {
        // Vérifier si le pseudo est déjà utilisé
        const existingArtist = await prisma.artist.findFirst({
            where: {
                pseudo: data.pseudo
            }
        })

        if (existingArtist) {
            return {
                success: false,
                message: 'Ce pseudo est déjà utilisé'
            }
        }

        const { artistsPage, ...prismaDataPartial } = data

        // Préparer les données avec des valeurs par défaut pour les champs obligatoires
        const prismaData = {
            ...prismaDataPartial,
            publicKey: data.publicKey || `default-${Date.now()}`,
            imageUrl: data.imageUrl || '',
            isGallery: data.isGallery || false,
            backgroundImage: data.backgroundImage || null
        }

        // Créer l'artiste
        const artist = await prisma.artist.create({
            data: prismaData
        })

        revalidatePath('/dataAdministration/artists')

        return {
            success: true,
            artist
        }
    } catch (error: any) {
        console.error('Erreur lors de la création de l\'artiste:', error)
        return {
            success: false,
            message: error.code === 'P2002'
                ? 'Un champ unique est déjà utilisé'
                : 'Une erreur est survenue lors de la création de l\'artiste'
        }
    }
} 