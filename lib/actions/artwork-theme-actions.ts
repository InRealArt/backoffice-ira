'use server'

import { prisma } from '@/lib/prisma'
import { ArtworkTheme } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getArtworkThemeById(id: number): Promise<ArtworkTheme | null> {
  try {
    return await prisma.artworkTheme.findUnique({
      where: { id }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du thème d\'œuvre:', error)
    return null
  }
}

export async function getAllArtworkThemes(): Promise<ArtworkTheme[]> {
  try {
    const artworkThemes = await prisma.artworkTheme.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    return artworkThemes
  } catch (error) {
    console.error('Erreur lors de la récupération des thèmes d\'œuvre:', error)
    return []
  }
}

export async function updateArtworkTheme(
  id: number,
  data: Omit<ArtworkTheme, 'id'>
): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.artworkTheme.update({
      where: { id },
      data
    })

    revalidatePath(`/dataAdministration/artwork-themes`)
    revalidatePath(`/dataAdministration/artwork-themes/${id}/edit`)

    return { success: true }
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du thème d\'œuvre:', error)

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

export async function createArtworkTheme(
  data: Omit<ArtworkTheme, 'id'>
): Promise<{ success: boolean; message?: string; id?: number }> {
  try {
    const newArtworkTheme = await prisma.artworkTheme.create({
      data
    })

    revalidatePath(`/dataAdministration/artwork-themes`)

    return {
      success: true,
      id: newArtworkTheme.id
    }
  } catch (error: any) {
    console.error('Erreur lors de la création du thème d\'œuvre:', error)

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

export async function deleteArtworkTheme(
  id: number
): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.artworkTheme.delete({
      where: { id }
    })

    revalidatePath(`/dataAdministration/artwork-themes`)

    return { success: true }
  } catch (error) {
    console.error('Erreur lors de la suppression du thème d\'œuvre:', error)
    return {
      success: false,
      message: 'Une erreur est survenue lors de la suppression.'
    }
  }
}


