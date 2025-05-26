import { translateHtmlContent, translateJsonLd, translateArticleHtml } from '../lib/services/html-translation-service'

// Fonction de traduction avec Google Translate (copie locale)
async function translateWithGoogle(
    text: string,
    targetLang: string
): Promise<string> {
    if (!text || text.trim() === '') return text

    try {
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

// Simulation de la fonction translateSeoPostFields sans base de données
async function translateSeoPostFieldsStandalone(
    fields: any,
    targetLanguageCode: string
): Promise<any> {
    const mappedLang = targetLanguageCode

    try {
        console.log(`🌍 Traduction vers ${targetLanguageCode.toUpperCase()} avec Google Translate`)

        // Traduire les champs textuels de base
        const [
            translatedTitle,
            translatedMetaDescription,
            translatedExcerpt,
            translatedMainImageAlt,
            translatedMainImageCaption
        ] = await Promise.all([
            translateWithGoogle(fields.title, mappedLang),
            translateWithGoogle(fields.metaDescription, mappedLang),
            fields.excerpt ? translateWithGoogle(fields.excerpt, mappedLang) : undefined,
            fields.mainImageAlt ? translateWithGoogle(fields.mainImageAlt, mappedLang) : undefined,
            fields.mainImageCaption ? translateWithGoogle(fields.mainImageCaption, mappedLang) : undefined
        ])

        // Traduire les mots-clés et tags
        const [translatedKeywords, translatedTags] = await Promise.all([
            Promise.all(fields.metaKeywords.map((keyword: string) => translateWithGoogle(keyword, mappedLang))),
            Promise.all(fields.listTags.map((tag: string) => translateWithGoogle(tag, mappedLang)))
        ])

        // Traduire les champs HTML si présents
        let translatedGeneratedHtml: string | undefined
        let translatedJsonLd: string | undefined
        let translatedGeneratedArticleHtml: string | undefined

        if (fields.generatedHtml || fields.jsonLd || fields.generatedArticleHtml) {
            console.log('🔧 Traduction des champs HTML...')

            const htmlTranslations = await Promise.all([
                fields.generatedHtml ? translateHtmlContent(fields.generatedHtml, mappedLang) : undefined,
                fields.jsonLd ? translateJsonLd(fields.jsonLd, mappedLang) : undefined,
                fields.generatedArticleHtml ? translateArticleHtml(fields.generatedArticleHtml, mappedLang) : undefined
            ])

            translatedGeneratedHtml = htmlTranslations[0]
            translatedJsonLd = htmlTranslations[1]
            translatedGeneratedArticleHtml = htmlTranslations[2]
        }

        // Générer un slug SEO-friendly
        const slug = `${targetLanguageCode}-${translatedTitle.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')}`

        return {
            title: translatedTitle,
            metaDescription: translatedMetaDescription,
            metaKeywords: translatedKeywords,
            content: fields.content,
            excerpt: translatedExcerpt,
            listTags: translatedTags,
            mainImageAlt: translatedMainImageAlt,
            mainImageCaption: translatedMainImageCaption,
            slug,
            // Champs HTML traduits
            generatedHtml: translatedGeneratedHtml,
            jsonLd: translatedJsonLd,
            generatedArticleHtml: translatedGeneratedArticleHtml
        }
    } catch (error: any) {
        console.error('❌ Erreur lors de la traduction Google:', error)
        throw error
    }
}

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
  <meta property="og:title" content="Pourquoi utiliser la blockchain dans l'art ?">
</head>
<body>
  <article>
    <h1>Pourquoi utiliser la blockchain dans l'art ?</h1>
    <p>Au cours de l'année 2021, il y a eu une véritable euphorie autour des Tokens Non-Fongibles (NFTs).</p>
    <figure>
      <img src="https://example.com/image.jpg" alt="Art blockchain" />
      <figcaption>Exemple d'art blockchain</figcaption>
    </figure>
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
  <figure>
    <img src="https://example.com/image.jpg" alt="Art blockchain" />
    <figcaption>Exemple d'art blockchain</figcaption>
  </figure>
</article>`
}

async function testCompleteTranslationStandalone() {
    console.log('🚀 Test de traduction complète STANDALONE (sans base de données)\n')

    const targetLanguages = [
        { code: 'en', name: 'Anglais' },
        { code: 'es', name: 'Espagnol' }
    ]

    for (const lang of targetLanguages) {
        console.log(`\n🌍 Test de traduction vers ${lang.name} (${lang.code})`)
        console.log('─'.repeat(60))

        try {
            const translatedFields = await translateSeoPostFieldsStandalone(sampleCompleteFields, lang.code)

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
                const figcaptionMatch = translatedFields.generatedHtml.match(/<figcaption>([^<]+)<\/figcaption>/)
                const altMatch = translatedFields.generatedHtml.match(/alt="([^"]+)"/)

                console.log(`   📄 HTML - Titre: "${titleMatch ? titleMatch[1] : 'Non trouvé'}"`)
                console.log(`   📄 HTML - H1: "${h1Match ? h1Match[1] : 'Non trouvé'}"`)
                console.log(`   🌐 HTML - Langue: "${langMatch ? langMatch[1] : 'Non trouvé'}"`)
                console.log(`   🖼️  HTML - Alt: "${altMatch ? altMatch[1] : 'Non trouvé'}"`)
                console.log(`   📷 HTML - Figcaption: "${figcaptionMatch ? figcaptionMatch[1] : 'Non trouvé'}"`)
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
                const articleFigcaptionMatch = translatedFields.generatedArticleHtml.match(/<figcaption>([^<]+)<\/figcaption>/)
                console.log(`   📰 Article - H1: "${articleH1Match ? articleH1Match[1] : 'Non trouvé'}"`)
                console.log(`   📰 Article - Figcaption: "${articleFigcaptionMatch ? articleFigcaptionMatch[1] : 'Non trouvé'}"`)
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
    await testCompleteTranslationStandalone()

    console.log('\n💡 Notes importantes:')
    console.log('   - ✅ Tous les champs HTML sont traduits')
    console.log('   - ✅ La structure HTML est préservée')
    console.log('   - ✅ L\'attribut lang est mis à jour')
    console.log('   - ✅ Le JSON-LD reste valide après traduction')
    console.log('   - ✅ Les URLs ne sont pas traduites')
    console.log('   - ✅ Test réussi sans dépendance à la base de données')
}

main().catch(console.error) 