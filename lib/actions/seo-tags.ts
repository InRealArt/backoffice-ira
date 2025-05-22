
import { prisma } from '@/lib/prisma'
import { generateSlug } from '../utils'

/**
 * Crée les tags SEO qui n'existent pas encore et établit les relations avec un article
 * @param postId - L'ID de l'article
 * @param tagNames - Les noms des tags à associer à l'article
 */
export async function createOrUpdateSeoTags(postId: number, tagNames: string[]) {
    try {
        // Filtrer les tags vides
        const validTagNames = tagNames.filter(tag => tag.trim() !== '')

        if (validTagNames.length === 0) {
            return { success: true, message: 'Aucun tag à traiter' }
        }

        // Générer les slugs pour chaque tag
        const tagSlugs = validTagNames.map(tag => ({
            name: tag.trim(),
            slug: generateSlug(tag.trim())
        }))

        // 1. Créer les tags qui n'existent pas encore
        for (const tagData of tagSlugs) {
            // Vérifier si le tag existe déjà
            const existingTag = await prisma.seoTag.findFirst({
                where: { slug: tagData.slug }
            })

            // Si le tag n'existe pas, on le crée
            if (!existingTag) {
                await prisma.seoTag.create({
                    data: {
                        name: tagData.name,
                        slug: tagData.slug
                    }
                })
            }
        }

        // 2. Récupérer tous les tags créés ou existants
        const allTags = await prisma.seoTag.findMany({
            where: {
                slug: { in: tagSlugs.map(t => t.slug) }
            }
        })

        // 3. Récupérer les relations existantes pour éviter les doublons
        const existingRelations = await prisma.seoPostTag.findMany({
            where: { postId }
        })

        const existingTagIds = existingRelations.map((rel: any) => rel.tagId)

        // 4. Créer les relations manquantes
        for (const tag of allTags) {
            // Vérifier si la relation n'existe pas déjà
            if (!existingTagIds.includes(tag.id)) {
                await prisma.seoPostTag.create({
                    data: {
                        postId,
                        tagId: tag.id
                    }
                })
            }
        }

        // 5. Supprimer les relations pour les tags qui ont été retirés
        const currentTagIds = allTags.map((tag: any) => tag.id)
        await prisma.seoPostTag.deleteMany({
            where: {
                postId,
                tagId: {
                    notIn: currentTagIds
                }
            }
        })

        return { success: true, message: 'Tags SEO mis à jour avec succès' }
    } catch (error) {
        console.error('Erreur lors de la mise à jour des tags SEO:', error)
        return { success: false, message: 'Erreur lors de la mise à jour des tags SEO' }
    }
}

/**
 * Récupère les tags SEO associés à un article
 * @param postId - L'ID de l'article
 */
export async function getSeoTagsByPostId(postId: number) {
    try {
        const postTags = await prisma.seoPostTag.findMany({
            where: { postId },
            include: {
                tag: true
            }
        })

        return {
            success: true,
            tags: postTags.map((pt: any) => pt.tag.name)
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des tags SEO:', error)
        return {
            success: false,
            tags: []
        }
    }
} 