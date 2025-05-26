import { translateHtmlContent, translateJsonLd, translateArticleHtml } from '../lib/services/html-translation-service'

const sampleHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pourquoi utiliser la blockchain dans l'art ? | InRealArt</title>
  <meta name="description" content="Les raisons d'utiliser la blockchain dans l'art">
  <meta property="og:title" content="Pourquoi utiliser la blockchain dans l'art ?">
  <meta property="og:description" content="Les raisons d'utiliser la blockchain dans l'art">
  <meta property="og:image" content="https://firebasestorage.googleapis.com/v0/b/inrealartlanding-3a094.appspot.com/o/sandbox%2Fbtc_art.png?alt=media&token=b3ec0f8b-8bca-404f-8dc9-f3533deffc0c">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Pourquoi utiliser la blockchain dans l'art ?">
  <meta name="twitter:description" content="Les raisons d'utiliser la blockchain dans l'art">
  <meta name="twitter:image" content="https://firebasestorage.googleapis.com/v0/b/inrealartlanding-3a094.appspot.com/o/sandbox%2Fbtc_art.png?alt=media&token=b3ec0f8b-8bca-404f-8dc9-f3533deffc0c">
  <meta name="author" content="gilles">
</head>
<body>
  <header>
    <nav>
      <!-- Navigation -->
    </nav>
  </header>
  
  <main>
      <article>
    <header>
      <h1>Pourquoi utiliser la blockchain dans l'art ?</h1>
      
      <div class="article-meta">
        <span class="author">Par gilles</span>
        <time datetime="2025-05-26">26 mai 2025</time>
      </div>
      
      <figure class="main-image">
        <img src="https://firebasestorage.googleapis.com/v0/b/inrealartlanding-3a094.appspot.com/o/sandbox%2Fbtc_art.png?alt=media&token=b3ec0f8b-8bca-404f-8dc9-f3533deffc0c" alt="Blockchain art" width="800" height="500">
        <figcaption>Blockchain art</figcaption>
      </figure>
    </header>
    
    <div class="introduction">
      <p>Au cours de l'année 2021, il y a eu une véritable euphorie autour des Tokens Non-Fongibles (NFTs) au cours de laquelle des millions d'utilisateurs découvraient les possibilités permises par ce secteur émergent de la blockchain.</p>
    </div>
    
    <div class="content">
    <section>
      <h2>Immortaliser ses oeuvres</h2>
      <figure>
        <img src="https://firebasestorage.googleapis.com/v0/b/inrealartlanding-3a094.appspot.com/o/sandbox%2Funderground_chapel_sistine.png?alt=media&token=9c5d5e38-174b-4006-bd47-058e87c8f495" alt="The Underground Sistine Chapel" width="600" height="400">
        <figcaption>The Underground Sistine Chapel</figcaption>
      </figure>
      <p>"The Underground Sistine Chapel" est un projet qui a vu le jour lors des confinements de 2020.</p>
    </section>
    </div>
    
    <div class="tags-section">
      <h3>Tags</h3>
      <div class="tags-list">
        <span class="tag-badge">art</span>
        <span class="tag-badge">blockchain</span>
      </div>
    </div>
  </article>
  </main>
  
  <footer>
    <!-- Footer -->
  </footer>
</body>
</html>`

const sampleJsonLd = `{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Pourquoi utiliser la blockchain dans l'art ?",
  "description": "Les raisons d'utiliser la blockchain dans l'art",
  "author": {
    "@type": "Person",
    "name": "gilles"
  },
  "datePublished": "2025-05-26",
  "keywords": ["art", "blockchain", "NFT"],
  "image": "https://firebasestorage.googleapis.com/v0/b/inrealartlanding-3a094.appspot.com/o/sandbox%2Fbtc_art.png?alt=media&token=b3ec0f8b-8bca-404f-8dc9-f3533deffc0c"
}`

const sampleArticleHtml = `<article>
  <h1>Pourquoi utiliser la blockchain dans l'art ?</h1>
  <p>Au cours de l'année 2021, il y a eu une véritable euphorie autour des Tokens Non-Fongibles (NFTs).</p>
  <h2>Immortaliser ses oeuvres</h2>
  <p>"The Underground Sistine Chapel" est un projet qui a vu le jour lors des confinements de 2020.</p>
</article>`

async function testHtmlTranslation() {
    console.log('🚀 Test de traduction HTML\n')

    const targetLang = 'en'

    try {
        console.log('📄 Test 1: Traduction du HTML complet')
        console.log('─'.repeat(50))

        const translatedHtml = await translateHtmlContent(sampleHtml, targetLang)

        console.log('✅ HTML traduit avec succès')
        console.log('Extraits traduits:')

        // Extraire quelques éléments traduits pour vérification
        const titleMatch = translatedHtml.match(/<title>([^<]+)<\/title>/)
        const h1Match = translatedHtml.match(/<h1>([^<]+)<\/h1>/)
        const metaDescMatch = translatedHtml.match(/<meta name="description" content="([^"]+)"/)
        const langMatch = translatedHtml.match(/<html[^>]*lang="([^"]*)"/)

        if (titleMatch) console.log(`📌 Titre: "${titleMatch[1]}"`)
        if (h1Match) console.log(`📝 H1: "${h1Match[1]}"`)
        if (metaDescMatch) console.log(`📄 Meta description: "${metaDescMatch[1]}"`)
        if (langMatch) console.log(`🌐 Langue: "${langMatch[1]}"`)

        console.log('\n🔍 Test 2: Traduction du JSON-LD')
        console.log('─'.repeat(50))

        const translatedJsonLd = await translateJsonLd(sampleJsonLd, targetLang)
        const jsonData = JSON.parse(translatedJsonLd)

        console.log('✅ JSON-LD traduit avec succès')
        console.log(`📌 Headline: "${jsonData.headline}"`)
        console.log(`📄 Description: "${jsonData.description}"`)
        console.log(`🏷️  Keywords: [${jsonData.keywords.join(', ')}]`)

        console.log('\n📰 Test 3: Traduction de l\'article HTML')
        console.log('─'.repeat(50))

        const translatedArticle = await translateArticleHtml(sampleArticleHtml, targetLang)

        console.log('✅ Article HTML traduit avec succès')

        const articleH1Match = translatedArticle.match(/<h1>([^<]+)<\/h1>/)
        const articleH2Match = translatedArticle.match(/<h2>([^<]+)<\/h2>/)

        if (articleH1Match) console.log(`📌 H1 Article: "${articleH1Match[1]}"`)
        if (articleH2Match) console.log(`📝 H2 Article: "${articleH2Match[1]}"`)

        console.log('\n✅ Tous les tests de traduction HTML réussis !')

    } catch (error) {
        console.error('❌ Erreur lors des tests:', error)
    }
}

async function testMultipleLanguages() {
    console.log('\n🌍 Test de traduction vers plusieurs langues')
    console.log('─'.repeat(50))

    const languages = [
        { code: 'en', name: 'Anglais' },
        { code: 'es', name: 'Espagnol' },
        { code: 'de', name: 'Allemand' }
    ]

    const simpleHtml = '<h1>Pourquoi utiliser la blockchain dans l\'art ?</h1><p>Les raisons d\'utiliser la blockchain dans l\'art</p>'

    for (const lang of languages) {
        try {
            console.log(`\n🔄 Traduction vers ${lang.name} (${lang.code})`)

            const translated = await translateHtmlContent(simpleHtml, lang.code)

            const h1Match = translated.match(/<h1>([^<]+)<\/h1>/)
            const pMatch = translated.match(/<p>([^<]+)<\/p>/)

            if (h1Match) console.log(`  📌 H1: "${h1Match[1]}"`)
            if (pMatch) console.log(`  📄 P: "${pMatch[1]}"`)

        } catch (error) {
            console.error(`❌ Erreur pour ${lang.name}:`, error)
        }
    }
}

async function main() {
    await testHtmlTranslation()
    await testMultipleLanguages()

    console.log('\n💡 Notes importantes:')
    console.log('   - Les URLs et dates ne sont pas traduites (préservées)')
    console.log('   - L\'attribut lang du HTML est automatiquement mis à jour')
    console.log('   - La structure HTML est entièrement préservée')
    console.log('   - Le JSON-LD est parsé et retraduit proprement')
    console.log('   - En cas d\'erreur, le contenu original est retourné')
}

main().catch(console.error) 