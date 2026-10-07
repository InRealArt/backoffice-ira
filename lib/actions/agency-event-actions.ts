'use server'

import { prisma } from '@/lib/prisma'
import { AgencyEvent } from '@/src/generated/prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSession } from '@/lib/auth-helpers'
import { checkIsAdmin } from '@/lib/actions/auth-actions'

const agencyEventSchema = z.object({
    name: z.string().trim().min(1).max(255),
    imageUrl: z.string().max(1024).nullable().optional(),
    description: z.string().trim().min(1),
    linkToEvent: z
        .string()
        .url()
        .refine((url) => /^https?:\/\//i.test(url), 'Seuls les liens http(s) sont autorisés')
        .nullable()
        .optional(),
    isFeatured: z.boolean().optional(),
})

export type AgencyEventInput = z.infer<typeof agencyEventSchema>

const UNAUTHORIZED = { success: false, message: 'Non autorisé' } as const

/**
 * Vérifie côté serveur que l'appelant est un admin authentifié.
 * Les server actions sont appelables directement : la protection du menu/layout ne suffit pas.
 */
async function isCurrentUserAdmin(): Promise<boolean> {
    const session = await getSession()
    const email = session?.user?.email
    return !!email && (await checkIsAdmin(email))
}

export async function getAllAgencyEvents(): Promise<AgencyEvent[]> {
    try {
        if (!(await isCurrentUserAdmin())) return []

        return await prisma.agencyEvent.findMany({
            orderBy: {
                id: 'desc'
            }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des événements agence:', error)
        return []
    }
}

export async function getAgencyEventById(id: number): Promise<AgencyEvent | null> {
    try {
        if (!(await isCurrentUserAdmin())) return null

        return await prisma.agencyEvent.findUnique({
            where: { id }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'événement agence:', error)
        return null
    }
}

export async function createAgencyEvent(
    input: AgencyEventInput
): Promise<{ success: boolean; message?: string; id?: number }> {
    try {
        if (!(await isCurrentUserAdmin())) return UNAUTHORIZED

        const parsed = agencyEventSchema.safeParse(input)
        if (!parsed.success) {
            return { success: false, message: 'Données invalides' }
        }
        const data = parsed.data

        // Plusieurs événements agence peuvent être mis en avant simultanément
        const agencyEvent = await prisma.agencyEvent.create({
            data: {
                name: data.name,
                imageUrl: data.imageUrl ?? null,
                description: data.description,
                linkToEvent: data.linkToEvent ?? null,
                isFeatured: data.isFeatured ?? false,
            }
        })

        revalidatePath('/landing/agency-events')

        return { success: true, id: agencyEvent.id }
    } catch (error) {
        console.error('Erreur lors de la création de l\'événement agence:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la création.'
        }
    }
}

export async function updateAgencyEvent(
    id: number,
    input: Partial<AgencyEventInput>
): Promise<{ success: boolean; message?: string }> {
    try {
        if (!(await isCurrentUserAdmin())) return UNAUTHORIZED

        const parsed = agencyEventSchema.partial().safeParse(input)
        if (!parsed.success) {
            return { success: false, message: 'Données invalides' }
        }
        const { name, imageUrl, description, linkToEvent, isFeatured } = parsed.data
        const data = { name, imageUrl, description, linkToEvent, isFeatured }

        await prisma.agencyEvent.update({
            where: { id },
            data
        })

        revalidatePath('/landing/agency-events')
        revalidatePath(`/landing/agency-events/${id}/edit`)

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'événement agence:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour.'
        }
    }
}

export async function deleteAgencyEvent(
    id: number
): Promise<{ success: boolean; message?: string }> {
    try {
        if (!(await isCurrentUserAdmin())) return UNAUTHORIZED

        // Supprimer les traductions associées en même temps que l'événement
        await prisma.$transaction([
            prisma.translation.deleteMany({
                where: {
                    entityType: 'AgencyEvent',
                    entityId: id
                }
            }),
            prisma.agencyEvent.delete({
                where: { id }
            })
        ])

        revalidatePath('/landing/agency-events')

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'événement agence:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression.'
        }
    }
}
