'use server'

import { prisma } from '@/lib/prisma'
import { Exhibition } from '@/src/generated/prisma/client'
import { revalidatePath } from 'next/cache'

export async function getAllExhibitions(): Promise<Exhibition[]> {
    try {
        return await prisma.exhibition.findMany({
            orderBy: {
                startDate: 'desc'
            }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des expositions:', error)
        return []
    }
}

export async function getExhibitionById(id: number): Promise<Exhibition | null> {
    try {
        return await prisma.exhibition.findUnique({
            where: { id }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'exposition:', error)
        return null
    }
}

export async function createExhibition(data: {
    name: string
    startDate: Date
    endDate: Date
    address: string
    imageUrl?: string | null
    description?: string | null
    linkToEvent?: string | null
}): Promise<{ success: boolean; message?: string; id?: number }> {
    try {
        const exhibition = await prisma.exhibition.create({
            data: {
                name: data.name,
                startDate: data.startDate,
                endDate: data.endDate,
                address: data.address,
                imageUrl: data.imageUrl ?? null,
                description: data.description ?? null,
                linkToEvent: data.linkToEvent ?? null,
            }
        })

        revalidatePath('/landing/exhibitions')

        return { success: true, id: exhibition.id }
    } catch (error: any) {
        console.error('Erreur lors de la création de l\'exposition:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la création.'
        }
    }
}

export async function updateExhibition(
    id: number,
    data: {
        name?: string
        startDate?: Date
        endDate?: Date
        address?: string
        imageUrl?: string | null
        description?: string | null
        linkToEvent?: string | null
    }
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.exhibition.update({
            where: { id },
            data
        })

        revalidatePath('/landing/exhibitions')
        revalidatePath(`/landing/exhibitions/${id}/edit`)

        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de l\'exposition:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour.'
        }
    }
}

export async function deleteExhibition(
    id: number
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.exhibition.delete({
            where: { id }
        })

        revalidatePath('/landing/exhibitions')

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'exposition:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression.'
        }
    }
}
