import { translateSeoPostFields } from '../lib/services/translation-service'

const sampleCompleteFields = {
    title: 'Pourquoi utiliser la blockchain dans l\'art ?',
    metaDescription: 'Les raisons d\'utiliser la blockchain dans l\'art',
    metaKeywords: ['art', 'blockchain', 'NFT'],
    content: JSON.stringify([
        {
            type: 'paragraph',
            content: 'Au cours de l\'année 2021, il y a eu une véritable euphorie autour des Tokens Non-Fongibles (NFTs).'
        }
    ]),
    excerpt: 'Un guide pour débuter dans l\'art numérique',
    listTags: ['art', 'blockchain'],
    mainImageAlt: 'Image représentant l\'art blockchain',
    mainImageCaption: 'Exemple d\'œuvre d\'art blockchain moderne',
    generatedHtml: `<!DOCTYPE html>
<html lang="fr">
<head>
  <title>Pourquoi utiliser la blockchain dans l'art ? | InRealArt</title>
  <meta name="description" content="Les raisons d'utiliser la blockchain dans l'art">
</head>
<body>
  <article>
    <h1>Pourquoi utiliser la blockchain dans l'art ?</h1>
    <p>Au cours de l'année 2021, il y a eu une véritable euphorie autour des Tokens Non-Fongibles (NFTs).</p>
  </article>
</body>
</html>`,
    jsonLd: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Pourquoi utiliser la blockchain dans l'art ?",
        "description": "Les raisons d'utiliser la blockchain dans l'art",
        "keywords": ["art", "blockchain", "NFT"]
    }, null, 2),
    generatedArticleHtml: `<article>
  <h1>Pourquoi utiliser la blockchain dans l'art ?</h1>
  <p>Au cours de l'année 2021, il y a eu une véritable euphorie autour des Tokens Non-Fongibles (NFTs).</p>
</article>`
}

async function testCompleteTranslation() {
    console.log('🚀 Test de traduction complète avec tous les champs\n')

    const targetLanguages = [
        { code: 'en', name: 'Anglais' },
        { code: 'es', name: 'Espagnol' }
    ]

    for (const lang of targetLanguages) {
        console.log(`\n🌍 Test de traduction vers ${lang.name} (${lang.code})`)
        console.log('─'.repeat(60))

        try {
            const translatedFields = await translateSeoPostFields(sampleCompleteFields, lang.code)

            console.log('✅ Traduction réussie !')
            console.log('\n📝 Champs textuels traduits :')
            console.log(`   📌 Titre: "${translatedFields.title}"`)
            console.log(`   📄 Description: "${translatedFields.metaDescription}"`)
            console.log(`   📝 Résumé: "${translatedFields.excerpt}"`)
            console.log(`   🏷️  Mots-clés: [${translatedFields.metaKeywords.join(', ')}]`)
            console.log(`   🔖 Tags: [${translatedFields.listTags.join(', ')}]`)
            console.log(`   🖼️  Alt image: "${translatedFields.mainImageAlt}"`)
            console.log(`   📷 Légende: "${translatedFields.mainImageCaption}"`)
            console.log(`   🔗 Slug: "${translatedFields.slug}"`)

            console.log('\n🌐 Champs HTML traduits :')

            // Vérifier le HTML complet
            if (translatedFields.generatedHtml) {
                const titleMatch = translatedFields.generatedHtml.match(/<title>([^<]+)<\/title>/)
                const h1Match = translatedFields.generatedHtml.match(/<h1>([^<]+)<\/h1>/)
                const langMatch = translatedFields.generatedHtml.match(/<html[^>]*lang="([^"]*)"/)

                console.log(`   📄 HTML - Titre: "${titleMatch ? titleMatch[1] : 'Non trouvé'}"`)
                console.log(`   📄 HTML - H1: "${h1Match ? h1Match[1] : 'Non trouvé'}"`)
                console.log(`   🌐 HTML - Langue: "${langMatch ? langMatch[1] : 'Non trouvé'}"`)
            } else {
                console.log('   ❌ generatedHtml: Absent')
            }

            // Vérifier le JSON-LD
            if (translatedFields.jsonLd) {
                try {
                    const jsonData = JSON.parse(translatedFields.jsonLd)
                    console.log(`   🔍 JSON-LD - Headline: "${jsonData.headline}"`)
                    console.log(`   🔍 JSON-LD - Description: "${jsonData.description}"`)
                    console.log(`   🔍 JSON-LD - Keywords: [${jsonData.keywords.join(', ')}]`)
                } catch (e) {
                    console.log('   ❌ JSON-LD: Erreur de parsing')
                }
            } else {
                console.log('   ❌ jsonLd: Absent')
            }

            // Vérifier l'article HTML
            if (translatedFields.generatedArticleHtml) {
                const articleH1Match = translatedFields.generatedArticleHtml.match(/<h1>([^<]+)<\/h1>/)
                console.log(`   📰 Article - H1: "${articleH1Match ? articleH1Match[1] : 'Non trouvé'}"`)
            } else {
                console.log('   ❌ generatedArticleHtml: Absent')
            }

            console.log('\n✅ Test complet réussi pour ' + lang.name)

        } catch (error) {
            console.error(`❌ Erreur pour ${lang.name}:`, error)
        }
    }
}

async function testFieldsPresence() {
    console.log('\n🔍 Test de présence des champs HTML dans les données d\'entrée')
    console.log('─'.repeat(60))

    console.log('Champs fournis :')
    console.log(`   - generatedHtml: ${sampleCompleteFields.generatedHtml ? 'Présent' : 'Absent'}`)
    console.log(`   - jsonLd: ${sampleCompleteFields.jsonLd ? 'Présent' : 'Absent'}`)
    console.log(`   - generatedArticleHtml: ${sampleCompleteFields.generatedArticleHtml ? 'Présent' : 'Absent'}`)

    if (sampleCompleteFields.generatedHtml) {
        console.log(`   - Taille HTML: ${sampleCompleteFields.generatedHtml.length} caractères`)
    }
    if (sampleCompleteFields.jsonLd) {
        console.log(`   - Taille JSON-LD: ${sampleCompleteFields.jsonLd.length} caractères`)
    }
    if (sampleCompleteFields.generatedArticleHtml) {
        console.log(`   - Taille Article HTML: ${sampleCompleteFields.generatedArticleHtml.length} caractères`)
    }
}

async function main() {
    await testFieldsPresence()
    await testCompleteTranslation()

    console.log('\n💡 Notes importantes:')
    console.log('   - Tous les champs HTML doivent être traduits')
    console.log('   - La structure HTML doit être préservée')
    console.log('   - L\'attribut lang doit être mis à jour')
    console.log('   - Le JSON-LD doit rester valide après traduction')
    console.log('   - En cas d\'erreur, les champs originaux sont retournés')
}

main().catch(console.error) 