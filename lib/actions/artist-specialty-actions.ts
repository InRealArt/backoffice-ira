'use server'

import { prisma } from '@/lib/prisma'
import type { ArtistSpecialty } from '@/src/generated/prisma/client'
import { requireAdmin } from '@/lib/auth-helpers'

/**
 * Récupère une spécialité d'artiste par son ID
 */
export async function getArtistSpecialtyById(id: number): Promise<ArtistSpecialty | null> {
    await requireAdmin()

    try {
        return await prisma.artistSpecialty.findUnique({
            where: { id }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de la spécialité:', error)
        return null
    }
}

/**
 * Récupère toutes les spécialités d'artiste
 */
export async function getAllArtistSpecialties(): Promise<ArtistSpecialty[]> {
    try {
        return await prisma.artistSpecialty.findMany({
            orderBy: {
                name: 'asc'
            }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des spécialités:', error)
        return []
    }
}

