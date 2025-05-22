'use server'

import { prisma } from '@/lib/prisma'

export async function getAllSeoPosts() {
    try {
        const seoPosts = await prisma.seoPost.findMany({
            include: {
                category: true,
                tags: {
                    include: {
                        tag: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        return seoPosts
    } catch (error) {
        console.error('Erreur lors de la récupération des articles SEO:', error)
        throw new Error('Impossible de récupérer les articles SEO')
    }
} 