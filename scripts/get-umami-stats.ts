#!/usr/bin/env tsx

/**
 * Script pour récupérer les statistiques Umami d'une œuvre
 * Usage: npx tsx scripts/get-umami-stats.ts <slug-oeuvre-ou-url>
 *        npm run umami-stats <slug-oeuvre-ou-url>
 * Exemples:
 *   npx tsx scripts/get-umami-stats.ts mon-oeuvre
 *   npx tsx scripts/get-umami-stats.ts https://www.inrealart.com/artwork/mon-oeuvre
 *   npm run umami-stats mon-oeuvre
 */

// Charger les variables d'environnement
import 'dotenv/config'

import {
  getUmamiStatsForArtwork,
  getUmamiMonthlyStatsForArtwork,
  generateArtworkSlug,
} from '../lib/actions/umami-actions'

/**
 * Type pour les statistiques Umami
 */
type UmamiStats = {
  pageviews: { value: number; delta?: number }
  visitors: { value: number; delta?: number }
  visits: { value: number; delta?: number }
  bounces: { value: number; delta?: number }
  totaltime: { value: number; delta?: number }
}

/**
 * Extrait le slug depuis une URL complète ou retourne le slug tel quel
 */
function extractSlugFromInput(input: string): string {
  // Si c'est une URL complète
  if (input.includes('inrealart.com/artwork/')) {
    const match = input.match(/artwork\/([^/?]+)/)
    if (match && match[1]) {
      return match[1]
    }
  }

  // Si c'est juste le slug, le retourner tel quel
  return input
}

async function main() {
  // Récupérer le slug depuis les arguments de la ligne de commande
  const args = process.argv.slice(2)

  // Vérifier les variables d'environnement
  if (!process.env.UMAMI_API_KEY) {
    console.error('❌ Erreur: UMAMI_API_KEY n\'est pas configuré')
    console.log('\nVeuillez configurer les variables d\'environnement dans .env.local:')
    console.log('  UMAMI_API_KEY=votre-api-key')
    console.log('  UMAMI_API_CLIENT_ENDPOINT=https://api.umami.is/v1')
    console.log('  UMAMI_WEBSITE_ID=votre-website-id')
    console.log('\nVoir docs/umami-configuration.md pour plus d\'informations')
    process.exit(1)
  }

  if (args.length === 0) {
    console.error('❌ Erreur: Veuillez fournir le slug de l\'œuvre ou l\'URL complète')
    console.log('\nUsage:')
    console.log('  npx tsx scripts/get-umami-stats.ts <slug-oeuvre-ou-url>')
    console.log('  npm run umami-stats <slug-oeuvre-ou-url>')
    console.log('\nExemples:')
    console.log('  npx tsx scripts/get-umami-stats.ts mon-oeuvre')
    console.log('  npx tsx scripts/get-umami-stats.ts https://www.inrealart.com/artwork/mon-oeuvre')
    console.log('  npm run umami-stats mon-oeuvre')
    console.log('\nLe slug correspond à la partie après /artwork/ dans l\'URL:')
    console.log('  https://www.inrealart.com/artwork/<slug-oeuvre>')
    process.exit(1)
  }

  const input = args[0]
  let slug = extractSlugFromInput(input)

  // Si le slug contient des espaces ou des caractères spéciaux, le convertir avec generateArtworkSlug
  // (cela signifie que l'utilisateur a probablement passé le nom de l'œuvre plutôt que le slug)
  if (slug.includes(' ') || slug.includes("'") || slug !== slug.toLowerCase()) {
    slug = await generateArtworkSlug(slug)
  }

  console.log('📊 Récupération des statistiques Umami')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n🎨 Slug de l'œuvre: ${slug}`)
  console.log(`🌐 URL: https://www.inrealart.com/artwork/${slug}`)
  console.log('\n')

  try {
    // Récupérer les statistiques globales (30 derniers jours)
    console.log('📈 Statistiques globales (30 derniers jours)')
    console.log('─────────────────────────────────────────────────')
    const statsResult = await getUmamiStatsForArtwork(slug)

    if (!statsResult.success) {
      console.error(`❌ Erreur: ${statsResult.error}`)
      process.exit(1)
    }

    const stats = statsResult.data?.stats

    if (!stats) {
      console.log('⚠️  Aucune statistique disponible pour cette période')
    } else {
      // Type guard: stats est non-null dans ce bloc
      const statsData: UmamiStats = stats
      console.log('\n📊 Résultats:')
      console.log('─'.repeat(50))

      if (statsData.pageviews?.value !== undefined) {
        console.log(
          `  📄 Pages vues:        ${statsData.pageviews.value.toLocaleString('fr-FR')}`
        )
        if (statsData.pageviews.delta !== undefined) {
          const delta = statsData.pageviews.delta
          const sign = delta >= 0 ? '+' : ''
          console.log(
            `     Variation:         ${sign}${delta.toLocaleString('fr-FR')}`
          )
        }
      }

      if (statsData.visitors?.value !== undefined) {
        console.log(
          `  👥 Visiteurs uniques: ${statsData.visitors.value.toLocaleString('fr-FR')}`
        )
        if (statsData.visitors.delta !== undefined) {
          const delta = statsData.visitors.delta
          const sign = delta >= 0 ? '+' : ''
          console.log(
            `     Variation:         ${sign}${delta.toLocaleString('fr-FR')}`
          )
        }
      }

      if (statsData.visits?.value !== undefined) {
        console.log(
          `  🔄 Visites:           ${statsData.visits.value.toLocaleString('fr-FR')}`
        )
        if (statsData.visits.delta !== undefined) {
          const delta = statsData.visits.delta
          const sign = delta >= 0 ? '+' : ''
          console.log(
            `     Variation:         ${sign}${delta.toLocaleString('fr-FR')}`
          )
        }
      }

      if (statsData.bounces?.value !== undefined && statsData.visits?.value !== undefined) {
        const bounceRate = (statsData.bounces.value / statsData.visits.value) * 100
        console.log(
          `  📉 Taux de rebond:    ${bounceRate.toFixed(1)}%`
        )
      }

      if (statsData.totaltime?.value !== undefined && statsData.visits?.value !== undefined) {
        const avgTime = statsData.totaltime.value / statsData.visits.value
        console.log(
          `  ⏱️  Temps moyen:       ${avgTime.toFixed(1)}s`
        )
      }

      console.log('─'.repeat(50))
    }

    // Récupérer les statistiques mensuelles
    console.log('\n\n📅 Statistiques mensuelles (12 derniers mois)')
    console.log('─────────────────────────────────────────────────')
    const monthlyResult = await getUmamiMonthlyStatsForArtwork(slug)

    if (!monthlyResult.success) {
      console.error(`❌ Erreur: ${monthlyResult.error}`)
    } else {
      const monthlyData = monthlyResult.data || []

      if (monthlyData.length === 0) {
        console.log('⚠️  Aucune statistique mensuelle disponible')
      } else {
        const totalViews = monthlyData.reduce(
          (sum, stat) => sum + stat.viewCount,
          0
        )

        console.log(`\n📊 Total des vues: ${totalViews.toLocaleString('fr-FR')}`)
        console.log('\n📈 Détail par mois:')
        console.log('─'.repeat(50))

        monthlyData.forEach((stat) => {
          console.log(
            `  ${stat.monthLabel.padEnd(20)} ${stat.viewCount
              .toLocaleString('fr-FR')
              .padStart(10)} vues`
          )
        })

        console.log('─'.repeat(50))
      }
    }

    console.log('\n✅ Statistiques récupérées avec succès!')
  } catch (error) {
    console.error('\n❌ Erreur lors de la récupération des statistiques:')
    console.error(error)
    process.exit(1)
  }
}

// Exécuter le script
main().catch((error) => {
  console.error('Erreur fatale:', error)
  process.exit(1)
})

