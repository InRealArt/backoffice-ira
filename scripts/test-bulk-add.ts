/**
 * Script de test pour la fonctionnalité d'ajout en masse
 * Ce script teste la création d'œuvres en prévente et leurs traductions
 */

import { createBulkPresaleArtworks } from '../lib/actions/presale-artwork-actions'
import { handleEntityTranslations } from '../lib/actions/translation-actions'

async function testBulkAdd() {
    console.log('🧪 Test de la fonctionnalité d\'ajout en masse...')

    try {
        // Données de test
        const testData = {
            artistId: 1, // Assurez-vous qu'un artiste avec l'ID 1 existe
            artworks: [
                {
                    name: 'Test Artwork 1',
                    description: 'Description de test 1',
                    price: 1000,
                    imageUrl: 'https://example.com/image1.jpg',
                    width: 50,
                    height: 70
                },
                {
                    name: 'Test Artwork 2',
                    description: 'Description de test 2',
                    price: 1500,
                    imageUrl: 'https://example.com/image2.jpg',
                    width: 60,
                    height: 80
                }
            ]
        }

        console.log('📝 Création des œuvres en masse...')
        const result = await createBulkPresaleArtworks(testData)

        if (result.success && result.artworks) {
            console.log('✅ Œuvres créées avec succès:', result.count)

            // Tester les traductions pour chaque œuvre créée
            for (let i = 0; i < result.artworks.length; i++) {
                const artwork = result.artworks[i]
                const originalData = testData.artworks[i]

                console.log(`🌐 Test des traductions pour l'œuvre ${artwork.id}...`)

                const translationResult = await handleEntityTranslations('PresaleArtwork', artwork.id, {
                    name: originalData.name,
                    description: originalData.description
                })

                if (translationResult.success) {
                    console.log(`✅ Traductions créées pour l'œuvre ${artwork.id}`)
                } else {
                    console.error(`❌ Erreur lors de la création des traductions pour l'œuvre ${artwork.id}:`, translationResult.message)
                }
            }

            console.log('🎉 Test terminé avec succès!')
        } else {
            console.error('❌ Erreur lors de la création des œuvres:', result.message)
        }

    } catch (error) {
        console.error('❌ Erreur lors du test:', error)
    }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
    testBulkAdd()
}

export { testBulkAdd }
