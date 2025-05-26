import { PrismaClient } from '@prisma/client'
import { updateSeoPost } from '../lib/actions/seo-post-actions'

const prisma = new PrismaClient()

async function testSeoPostUpdate() {
    try {
        console.log('🧪 Test de mise à jour d\'un article SEO traduit...')

        // Trouver un article SEO traduit (avec originalPostId)
        const translatedPost = await prisma.seoPost.findFirst({
            where: {
                originalPostId: { not: null }
            },
            include: {
                language: true,
                originalPost: true
            }
        })

        if (!translatedPost) {
            console.log('❌ Aucun article SEO traduit trouvé pour le test')
            return
        }

        console.log(`📝 Article trouvé: "${translatedPost.title}" (ID: ${translatedPost.id})`)
        console.log(`🌍 Langue: ${translatedPost.language.name} (${translatedPost.language.code})`)
        console.log(`🔗 Article original: ${translatedPost.originalPost?.title} (ID: ${translatedPost.originalPostId})`)

        // Tester la mise à jour avec des tags qui pourraient causer des conflits
        const testData = {
            title: `${translatedPost.title} - Mis à jour ${new Date().toISOString()}`,
            metaDescription: `Description mise à jour pour ${translatedPost.language.name}`,
            listTags: ['Art', 'art', 'ART', 'Design', 'design'], // Tags qui pourraient causer des conflits de slug
            content: translatedPost.content,
            excerpt: `Extrait mis à jour en ${translatedPost.language.name}`
        }

        console.log('🔄 Mise à jour en cours...')
        const result = await updateSeoPost(translatedPost.id, testData)

        if (result.success) {
            console.log('✅ Mise à jour réussie!')
            console.log(`📄 Article mis à jour: ${result.seoPost?.title}`)
        } else {
            console.log('❌ Échec de la mise à jour:', result.message)
        }

    } catch (error) {
        console.error('❌ Erreur lors du test:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// Exécuter le test
testSeoPostUpdate() 