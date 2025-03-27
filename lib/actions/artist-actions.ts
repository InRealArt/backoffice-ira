'use server'

import { prisma } from '@/lib/prisma'
import { Artist } from '@prisma/client'
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
    data: Omit<Artist, 'id'>
): Promise<{ success: boolean; message?: string }> {
    try {
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