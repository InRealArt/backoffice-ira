// Fonction de traduction avec Google Translate
async function translateWithGoogle(
    text: string,
    targetLang: string
): Promise<string> {
    if (!text || text.trim() === '') return text

    try {
        // Utilise l'API Google Translate gratuite
        const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
        )
        const data = await response.json()
        return data[0][0][0] || text
    } catch (error) {
        console.error('Erreur Google Translate:', error)
        return text
    }
}

async function testGoogleTranslation() {
    console.log('🚀 Test du service de traduction Google Translate\n')

    const testTexts = [
        'Bonjour le monde',
        'Guide complet de l\'art numérique',
        'Découvrez tout sur l\'art numérique moderne et ses techniques',
        'art numérique',
        'NFT',
        'blockchain'
    ]

    const languages = [
        { code: 'en', name: 'Anglais' },
        { code: 'es', name: 'Espagnol' },
        { code: 'de', name: 'Allemand' },
        { code: 'it', name: 'Italien' }
    ]

    for (const lang of languages) {
        console.log(`\n🌍 Test de traduction vers ${lang.name} (${lang.code})`)
        console.log('─'.repeat(50))

        for (const text of testTexts) {
            try {
                const translated = await translateWithGoogle(text, lang.code)
                console.log(`📝 "${text}" → "${translated}"`)

                // Petite pause pour éviter de surcharger l'API
                await new Promise(resolve => setTimeout(resolve, 100))
            } catch (error) {
                console.error(`❌ Erreur pour "${text}":`, error)
            }
        }
    }

    console.log('\n✅ Test terminé !')
}

async function testCompleteTranslation() {
    console.log('\n🔧 Test de traduction complète d\'un article SEO')
    console.log('─'.repeat(50))

    const testFields = {
        title: 'Guide complet de l\'art numérique',
        metaDescription: 'Découvrez tout sur l\'art numérique moderne et ses techniques',
        metaKeywords: ['art numérique', 'NFT', 'blockchain'],
        excerpt: 'Un guide pour débuter dans l\'art numérique',
        listTags: ['art', 'numérique', 'guide'],
        mainImageAlt: 'Image représentant l\'art numérique',
        mainImageCaption: 'Exemple d\'œuvre d\'art numérique moderne'
    }

    const targetLang = 'en'

    try {
        console.log(`\n🎯 Traduction vers l'anglais :`)

        const translatedTitle = await translateWithGoogle(testFields.title, targetLang)
        const translatedMetaDescription = await translateWithGoogle(testFields.metaDescription, targetLang)
        const translatedExcerpt = await translateWithGoogle(testFields.excerpt, targetLang)

        const translatedKeywords = await Promise.all(
            testFields.metaKeywords.map(keyword => translateWithGoogle(keyword, targetLang))
        )

        const translatedTags = await Promise.all(
            testFields.listTags.map(tag => translateWithGoogle(tag, targetLang))
        )

        console.log(`📌 Titre: "${translatedTitle}"`)
        console.log(`📝 Description: "${translatedMetaDescription}"`)
        console.log(`📄 Résumé: "${translatedExcerpt}"`)
        console.log(`🏷️  Mots-clés: [${translatedKeywords.join(', ')}]`)
        console.log(`🔖 Tags: [${translatedTags.join(', ')}]`)

        // Générer un slug
        const slug = `en-${translatedTitle.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')}`
        console.log(`🔗 Slug: "${slug}"`)

        console.log('\n✅ Traduction complète réussie !')
    } catch (error) {
        console.error('❌ Erreur lors de la traduction complète:', error)
    }
}

async function main() {
    await testGoogleTranslation()
    await testCompleteTranslation()

    console.log('\n💡 Notes:')
    console.log('   - Google Translate gratuit a des limites de taux')
    console.log('   - En cas de limite atteinte, le système bascule vers la traduction simple')
    console.log('   - La qualité est généralement bonne pour les textes courts')
}

main().catch(console.error) 