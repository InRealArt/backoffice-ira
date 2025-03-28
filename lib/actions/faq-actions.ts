'use server'

import { prisma } from '@/lib/prisma'
import { Faq } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getFaqById(id: number): Promise<Faq | null> {
    try {
        return await prisma.faq.findUnique({
            where: { id }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de la FAQ:', error)
        return null
    }
}

export async function updateFaq(
    id: number,
    data: Omit<Faq, 'id'>
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.faq.update({
            where: { id },
            data
        })

        revalidatePath(`/landing/faq`)
        revalidatePath(`/landing/faq/${id}/edit`)

        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de la FAQ:', error)

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

export async function createFaq(
    data: Omit<Faq, 'id'>
): Promise<{ success: boolean; faq?: Faq; message?: string }> {
    try {
        const faq = await prisma.faq.create({
            data
        })

        revalidatePath(`/landing/faq`)

        return {
            success: true,
            faq
        }
    } catch (error: any) {
        console.error('Erreur lors de la création de la FAQ:', error)

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

export async function deleteFaq(
    id: number
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.faq.delete({
            where: { id }
        })

        revalidatePath(`/landing/faq`)

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression de la FAQ:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression.'
        }
    }
} 