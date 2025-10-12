'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { StickyFooter } from '@prisma/client'

/**
 * Récupère tous les sticky footers
 */
export async function getAllStickyFooters() {
    try {
        const stickyFooters = await prisma.stickyFooter.findMany({
            orderBy: {
                id: 'desc'
            }
        }) || []

        return {
            success: true,
            stickyFooters
        }
    } catch (error) {
        console.error('Failed to fetch sticky footers:', error)
        return {
            success: false,
            error: 'Failed to fetch sticky footers'
        }
    }
}

/**
 * Récupère un sticky footer par son ID
 */
export async function getStickyFooterById(id: number) {
    try {
        const stickyFooter = await prisma.stickyFooter.findUnique({
            where: { id }
        })

        return stickyFooter
    } catch (error) {
        console.error('Erreur lors de la récupération du sticky footer:', error)
        return null
    }
}

/**
 * Crée un nouveau sticky footer
 */
export async function createStickyFooter(data: {
    activeOnAllPages: boolean
    activeOnSpecificPages: boolean
    specificPages: string[]
    endValidityDate?: Date
    title?: string
    text?: string
    textButton?: string
    buttonUrl?: string
}) {
    try {
        const stickyFooter = await prisma.stickyFooter.create({
            data: {
                activeOnAllPages: data.activeOnAllPages,
                activeOnSpecificPages: data.activeOnSpecificPages,
                specificPages: data.specificPages,
                endValidityDate: data.endValidityDate,
                title: data.title,
                text: data.text,
                textButton: data.textButton,
                buttonUrl: data.buttonUrl
            }
        })

        revalidatePath('/landing/sticky-footer')
        return {
            success: true,
            stickyFooter
        }
    } catch (error) {
        console.error('Erreur lors de la création du sticky footer:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Met à jour un sticky footer existant
 */
export async function updateStickyFooter(id: number, data: {
    activeOnAllPages?: boolean
    activeOnSpecificPages?: boolean
    specificPages?: string[]
    endValidityDate?: Date
    title?: string
    text?: string
    textButton?: string
    buttonUrl?: string
}) {
    try {
        const updateData: any = {}

        if (data.activeOnAllPages !== undefined) updateData.activeOnAllPages = data.activeOnAllPages
        if (data.activeOnSpecificPages !== undefined) updateData.activeOnSpecificPages = data.activeOnSpecificPages
        if (data.specificPages !== undefined) updateData.specificPages = data.specificPages
        if (data.endValidityDate !== undefined) updateData.endValidityDate = data.endValidityDate
        if (data.title !== undefined) updateData.title = data.title
        if (data.text !== undefined) updateData.text = data.text
        if (data.textButton !== undefined) updateData.textButton = data.textButton
        if (data.buttonUrl !== undefined) updateData.buttonUrl = data.buttonUrl

        const stickyFooter = await prisma.stickyFooter.update({
            where: { id },
            data: updateData
        })

        revalidatePath('/landing/sticky-footer')
        revalidatePath(`/landing/sticky-footer/${id}/edit`)

        return {
            success: true,
            stickyFooter
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du sticky footer:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Supprime un sticky footer
 */
export async function deleteStickyFooter(id: number) {
    try {
        await prisma.stickyFooter.delete({
            where: { id }
        })

        revalidatePath('/landing/sticky-footer')

        return {
            success: true
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du sticky footer:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}
