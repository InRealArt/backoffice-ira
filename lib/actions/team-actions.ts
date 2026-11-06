'use server'

import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { Team } from '@/src/generated/prisma/client'
import { revalidatePath } from '@/lib/landing-revalidation' // + purge du landing (IRA-22)
import { toRelativePath } from '@/lib/r2/url'

export async function getTeamMemberById(id: number): Promise<Team | null> {
    await requireAdmin()
    try {
        return await prisma.team.findUnique({
            where: { id }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération du membre d\'équipe:', error)
        return null
    }
}

export async function getAllTeamMembers(): Promise<Team[]> {
    await requireAdmin()
    try {
        const teamMembers = await prisma.team.findMany({
            orderBy: {
                order: 'asc'
            }
        })
        return teamMembers
    } catch (error) {
        console.error('Erreur lors de la récupération des membres d\'équipe:', error)
        return []
    }
}

export async function updateTeamMember(
    id: number,
    data: Omit<Team, 'id'>
): Promise<{ success: boolean; message?: string }> {
    await requireAdmin()
    try {
        await prisma.team.update({
            where: { id },
            data: {
                ...data,
                photoUrl1: toRelativePath(data.photoUrl1) ?? data.photoUrl1 ?? null,
                photoUrl2: toRelativePath(data.photoUrl2) ?? data.photoUrl2 ?? null,
            }
        })

        revalidatePath(`/landing/team`)
        revalidatePath(`/landing/team/${id}/edit`)

        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour du membre d\'équipe:', error)

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

export async function createTeamMember(
    data: Omit<Team, 'id'>
): Promise<{ success: boolean; message?: string; id?: number }> {
    await requireAdmin()
    try {
        const newTeamMember = await prisma.team.create({
            data: {
                ...data,
                photoUrl1: toRelativePath(data.photoUrl1) ?? data.photoUrl1 ?? null,
                photoUrl2: toRelativePath(data.photoUrl2) ?? data.photoUrl2 ?? null,
            }
        })

        revalidatePath(`/landing/team`)

        return {
            success: true,
            id: newTeamMember.id
        }
    } catch (error: any) {
        console.error('Erreur lors de la création du membre d\'équipe:', error)

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

export async function updateTeamMemberVisible(
    id: number,
    visible: boolean
): Promise<{ success: boolean; message?: string }> {
    await requireAdmin()
    try {
        await prisma.team.update({
            where: { id },
            data: { visible }
        })

        revalidatePath(`/landing/team`)
        revalidatePath(`/landing/team/${id}/edit`)

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la visibilité:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour.'
        }
    }
}

export async function deleteTeamMember(
    id: number
): Promise<{ success: boolean; message?: string }> {
    await requireAdmin()
    try {
        await prisma.team.delete({
            where: { id }
        })

        revalidatePath(`/landing/team`)

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression du membre d\'équipe:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression.'
        }
    }
} 