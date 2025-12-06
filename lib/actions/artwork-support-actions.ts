'use server'

import { prisma } from '@/lib/prisma'
import { ArtworkSupport } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getArtworkSupportById(id: number): Promise<ArtworkSupport | null> {
    try {
        return await prisma.artworkSupport.findUnique({
            where: { id }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération du support d\'œuvre:', error)
        return null
    }
}

export async function getAllArtworkSupports(): Promise<ArtworkSupport[]> {
    try {
        const artworkSupports = await prisma.artworkSupport.findMany({
            orderBy: {
                name: 'asc'
            }
        })
        return artworkSupports
    } catch (error) {
        console.error('Erreur lors de la récupération des supports d\'œuvre:', error)
        return []
    }
}

export async function updateArtworkSupport(
    id: number,
    data: Omit<ArtworkSupport, 'id'>
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.artworkSupport.update({
            where: { id },
            data
        })

        revalidatePath(`/dataAdministration/artwork-supports`)
        revalidatePath(`/dataAdministration/artwork-supports/${id}/edit`)

        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour du support d\'œuvre:', error)

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

export async function createArtworkSupport(
    data: Omit<ArtworkSupport, 'id'>
): Promise<{ success: boolean; message?: string; id?: number }> {
    try {
        const newArtworkSupport = await prisma.artworkSupport.create({
            data
        })

        revalidatePath(`/dataAdministration/artwork-supports`)

        return {
            success: true,
            id: newArtworkSupport.id
        }
    } catch (error: any) {
        console.error('Erreur lors de la création du support d\'œuvre:', error)

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

export async function deleteArtworkSupport(
    id: number
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.artworkSupport.delete({
            where: { id }
        })

        revalidatePath(`/dataAdministration/artwork-supports`)

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression du support d\'œuvre:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression.'
        }
    }
}

