/**
 * Script TypeScript pour hydrater les tables de statistiques de vues
 * PhysicalArtworkView et PhysicalArtworkViewStat avec des données de test
 *
 * Usage: npx tsx scripts/seed-physical-artwork-views.ts
 * Ou avec connexion directe: USE_DIRECT_PRISMA=1 npx tsx scripts/seed-physical-artwork-views.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@/src/generated/prisma/client'

// Créer une instance Prisma avec la bonne configuration
// Utiliser DIRECT_URL si USE_DIRECT_PRISMA est défini (recommandé pour Supabase)
const prismaClientOptions = {
    log: ['warn', 'error'] as ('info' | 'warn' | 'error')[],
    datasources: process.env.USE_DIRECT_PRISMA === '1' && process.env.DIRECT_URL
        ? { db: { url: process.env.DIRECT_URL } }
        : undefined
}

const prisma = new PrismaClient(prismaClientOptions)

// Configuration
const MONTHS_TO_GENERATE = 6 // Nombre de mois de données à générer
const MIN_VIEWS_PER_MONTH = 10 // Nombre minimum de vues par mois
const MAX_VIEWS_PER_MONTH = 200 // Nombre maximum de vues par mois

// Données de test
const IP_ADDRESSES = [
    '192.168.1.1',
    '192.168.1.2',
    '192.168.1.3',
    '10.0.0.1',
    '10.0.0.2',
    '10.0.0.3',
    '172.16.0.1',
    '172.16.0.2',
    '172.16.0.3',
    '203.0.113.1',
    '203.0.113.2',
    '203.0.113.3',
    '198.51.100.1',
    '198.51.100.2',
    '198.51.100.3'
]

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/91.0'
]

function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomDateInMonth(year: number, month: number): Date {
    const daysInMonth = new Date(year, month, 0).getDate()
    const day = getRandomInt(1, daysInMonth)
    const hour = getRandomInt(0, 23)
    const minute = getRandomInt(0, 59)
    const second = getRandomInt(0, 59)

    return new Date(year, month - 1, day, hour, minute, second)
}

async function checkTablesExist(): Promise<boolean> {
    try {
        // Vérifier si le schéma statistics existe
        const schemaCheck = await prisma.$queryRaw<Array<{ schema_name: string }>>`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = 'statistics'
        `

        if (schemaCheck.length === 0) {
            console.error(`   ❌ Le schéma 'statistics' n'existe pas!`)
            return false
        }

        // Vérifier toutes les tables dans le schéma statistics
        const allTables = await prisma.$queryRaw<Array<{ table_name: string }>>`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'statistics'
            ORDER BY table_name
        `

        console.log(`   📋 Tables trouvées dans le schéma 'statistics':`)
        if (allTables.length === 0) {
            console.error(`      Aucune table trouvée`)
        } else {
            allTables.forEach(r => {
                console.log(`      - ${r.table_name}`)
            })
        }

        // Tester l'accès réel aux tables via Prisma
        console.log(`\n   🔍 Test d'accès aux tables via Prisma...`)
        try {
            // Tester PhysicalArtworkView
            await prisma.physicalArtworkView.findFirst({ take: 1 })
            console.log(`      ✅ PhysicalArtworkView accessible`)
        } catch (error: any) {
            console.error(`      ❌ PhysicalArtworkView non accessible: ${error.message}`)
            if (error.message?.includes('does not exist')) {
                console.error(`\n   💡 La table n'existe pas encore. Exécutez:`)
                console.error(`      npx prisma db push`)
                console.error(`      ou`)
                console.error(`      npx prisma migrate dev --name add_physical_artwork_views`)
                return false
            }
            throw error
        }

        try {
            // Tester PhysicalArtworkViewStat
            await prisma.physicalArtworkViewStat.findFirst({ take: 1 })
            console.log(`      ✅ PhysicalArtworkViewStat accessible`)
        } catch (error: any) {
            console.error(`      ❌ PhysicalArtworkViewStat non accessible: ${error.message}`)
            if (error.message?.includes('does not exist')) {
                console.error(`\n   💡 La table n'existe pas encore. Exécutez:`)
                console.error(`      npx prisma db push`)
                console.error(`      ou`)
                console.error(`      npx prisma migrate dev --name add_physical_artwork_views`)
                return false
            }
            throw error
        }

        console.log(`\n   ✅ Toutes les tables requises sont accessibles`)
        return true
    } catch (error: any) {
        console.error(`   ❌ Erreur lors de la vérification: ${error.message}`)
        return false
    }
}

async function seedPhysicalArtworkViews() {
    try {
        console.log('🌱 Début de la génération des données de test...\n')

        // Afficher le mode de connexion
        if (process.env.USE_DIRECT_PRISMA === '1') {
            console.log('🔗 Mode: Connexion directe (DIRECT_URL)')
        } else {
            console.log('🔗 Mode: Connexion via pooler (DATABASE_URL)')
            if (process.env.DIRECT_URL) {
                console.log('💡 Astuce: Utilisez USE_DIRECT_PRISMA=1 pour une connexion directe si vous rencontrez des problèmes')
            }
        }
        console.log('')

        // Tester la connexion à la base de données
        console.log('🔌 Test de connexion à la base de données...')
        await prisma.$connect()
        console.log('✅ Connexion réussie\n')

        // Vérifier que les tables de statistiques existent
        console.log('🔍 Vérification de l\'existence des tables...')
        const tablesExist = await checkTablesExist()
        if (!tablesExist) {
            console.error('\n❌ Les tables de statistiques n\'existent pas encore!')
            console.error('\n💡 Vous devez d\'abord créer les tables en exécutant une migration Prisma:')
            console.error('   1. npx prisma migrate dev --name add_physical_artwork_views')
            console.error('   2. Ou: npx prisma db push')
            console.error('\n   Les tables attendues dans le schéma "statistics":')
            console.error('   - PhysicalArtworkView (ou variante)')
            console.error('   - PhysicalArtworkViewStat (ou variante)')
            console.error('\n   Ensuite, réessayez ce script.')
            process.exit(1)
        }
        console.log('')

        // Récupérer les PhysicalItem existants (en ligne de préférence)
        let physicalItems = await prisma.physicalItem.findMany({
            where: {
                isOnline: true
            },
            select: {
                id: true
            },
            take: 20 // Limiter à 20 items pour ne pas surcharger
        })

        // Si aucun PhysicalItem en ligne, chercher tous les PhysicalItem
        if (physicalItems.length === 0) {
            console.log('⚠️  Aucun PhysicalItem en ligne trouvé.')
            console.log('🔍 Recherche de tous les PhysicalItem...')

            physicalItems = await prisma.physicalItem.findMany({
                select: {
                    id: true
                },
                take: 20 // Limiter à 20 items pour ne pas surcharger
            })

            if (physicalItems.length === 0) {
                console.error('\n❌ Aucun PhysicalItem trouvé dans la base de données!')
                console.error('\n💡 Vous devez d\'abord créer des PhysicalItem avant de générer des statistiques.')
                console.error('   Les vues nécessitent des PhysicalItem existants à cause de la contrainte de clé étrangère.')
                process.exit(1)
            } else {
                console.log(`✅ ${physicalItems.length} PhysicalItem(s) trouvé(s) (hors ligne)\n`)
            }
        } else {
            console.log(`✅ ${physicalItems.length} PhysicalItem(s) en ligne trouvé(s)\n`)
        }

        // Afficher les IDs trouvés pour debug
        console.log('📋 IDs des PhysicalItem à utiliser:')
        physicalItems.forEach((item, index) => {
            console.log(`   ${index + 1}. ID: ${item.id}`)
        })
        console.log('')

        // ÉTAPE 1: Générer toutes les vues pour chaque PhysicalItem
        console.log('📝 ÉTAPE 1: Génération de toutes les vues...\n')
        let successCount = 0
        let errorCount = 0
        let totalViewsCreated = 0

        for (const item of physicalItems) {
            try {
                const viewsCreated = await generateViewsForArtwork(item.id)
                totalViewsCreated += viewsCreated
                successCount++
            } catch (error: any) {
                errorCount++
                console.error(`   ❌ Erreur lors de la génération des vues pour l'artwork ${item.id}:`, error.message)
                // Continuer avec les autres items même en cas d'erreur
            }
        }

        console.log(`\n📊 Résumé ÉTAPE 1: ${successCount} artwork(s) traité(s) avec succès, ${errorCount} erreur(s)`)
        console.log(`   Total de vues créées: ${totalViewsCreated}\n`)

        // ÉTAPE 2: Générer les agrégations mensuelles à partir des vues réelles
        await generateStatsFromViews()

        // Afficher les statistiques
        await displayStatistics()

        console.log('\n✨ Génération terminée avec succès!')
    } catch (error: any) {
        console.error('❌ Erreur lors de la génération:', error.message)

        if (error.message?.includes("Can't reach database server") || error.code === 'P1001') {
            console.error('\n💡 Suggestions pour résoudre le problème de connexion:')
            console.error('')

            if (process.env.USE_DIRECT_PRISMA !== '1' && process.env.DIRECT_URL) {
                console.error('  ✅ Solution recommandée: Utilisez la connexion directe')
                console.error('     USE_DIRECT_PRISMA=1 npx tsx scripts/seed-physical-artwork-views.ts')
                console.error('')
            }

            console.error('  1. Vérifiez que vos variables d\'environnement sont correctement configurées:')
            console.error('     - DATABASE_URL (pour le pooler)')
            if (process.env.DIRECT_URL) {
                console.error('     - DIRECT_URL (pour la connexion directe) ✅')
            } else {
                console.error('     - DIRECT_URL (pour la connexion directe) ❌ manquante')
            }
            console.error('')
            console.error('  2. Si vous utilisez Supabase:')
            console.error('     - Le pooler (port 6543) peut être instable')
            console.error('     - Utilisez toujours USE_DIRECT_PRISMA=1 avec DIRECT_URL')
            console.error('')
            console.error('  3. Vérifiez que votre base de données est accessible et que le firewall autorise votre IP')
        }

        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Étape 1: Générer toutes les vues pour un artwork
async function generateViewsForArtwork(artworkId: bigint): Promise<number> {
    // Vérifier que le PhysicalItem existe vraiment via une requête SQL directe
    const physicalItemCheck = await prisma.$queryRaw<Array<{ id: bigint }>>`
        SELECT id 
        FROM backoffice."PhysicalItem" 
        WHERE id = ${artworkId}
    `

    if (physicalItemCheck.length === 0) {
        console.error(`   ⚠️  PhysicalItem avec l'ID ${artworkId} n'existe pas dans le schéma backoffice, ignoré`)
        return 0
    }

    console.log(`   📊 Génération des vues pour l'artwork ID: ${artworkId}`)

    const now = new Date()
    let totalViews = 0

    for (let monthOffset = 1; monthOffset <= MONTHS_TO_GENERATE; monthOffset++) {
        const targetDate = new Date(now)
        targetDate.setMonth(targetDate.getMonth() - monthOffset)

        const year = targetDate.getFullYear()
        const month = targetDate.getMonth() + 1

        // Nombre aléatoire de vues pour ce mois
        const viewCount = getRandomInt(MIN_VIEWS_PER_MONTH, MAX_VIEWS_PER_MONTH)

        // Générer les vues individuelles
        const views: Array<{
            artworkId: bigint
            viewerId: bigint | null
            viewedAt: Date
            ipAddress: string
            userAgent: string
        }> = []

        for (let i = 0; i < viewCount; i++) {
            const viewedAt = getRandomDateInMonth(year, month)
            const ipAddress = getRandomElement(IP_ADDRESSES)
            const userAgent = getRandomElement(USER_AGENTS)
            const viewerId = Math.random() > 0.7 ? BigInt(getRandomInt(1, 100)) : null

            views.push({
                artworkId,
                viewerId,
                viewedAt,
                ipAddress,
                userAgent
            })
        }

        // Insérer les vues en batch
        await prisma.physicalArtworkView.createMany({
            data: views,
            skipDuplicates: true
        })

        totalViews += viewCount
        console.log(`      📊 Artwork ${artworkId} - ${month}/${year}: ${viewCount} vues créées`)
    }

    return totalViews
}

// Étape 2: Générer les agrégations mensuelles à partir des vues réelles
async function generateStatsFromViews() {
    console.log('\n📊 Génération des agrégations mensuelles à partir des vues...\n')

    // Récupérer toutes les vues groupées par artwork, année et mois
    const stats = await prisma.$queryRaw<Array<{
        artworkId: bigint
        year: number
        month: number
        viewCount: bigint
    }>>`
        SELECT 
            "artworkId",
            EXTRACT(YEAR FROM "viewedAt")::INTEGER as year,
            EXTRACT(MONTH FROM "viewedAt")::INTEGER as month,
            COUNT(*)::BIGINT as "viewCount"
        FROM statistics."PhysicalArtworkView"
        GROUP BY "artworkId", EXTRACT(YEAR FROM "viewedAt"), EXTRACT(MONTH FROM "viewedAt")
        ORDER BY "artworkId", year DESC, month DESC
    `

    console.log(`   📋 ${stats.length} agrégation(s) à créer\n`)

    let successCount = 0
    let errorCount = 0

    for (const stat of stats) {
        try {
            // Vérifier que l'artworkId existe dans backoffice.PhysicalItem
            const idExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
                SELECT EXISTS(
                    SELECT 1 FROM backoffice."PhysicalItem" WHERE id = ${stat.artworkId}
                ) as exists
            `

            if (!idExists[0]?.exists) {
                console.error(`   ⚠️  L'ID ${stat.artworkId} n'existe pas dans backoffice.PhysicalItem, ignoré`)
                errorCount++
                continue
            }

            // Utiliser SQL brut pour insérer l'agrégation
            await prisma.$executeRaw`
                INSERT INTO statistics."PhysicalArtworkViewStat" ("artworkId", "year", "month", "viewCount")
                VALUES (${stat.artworkId}, ${stat.year}, ${stat.month}, ${Number(stat.viewCount)})
                ON CONFLICT ("artworkId", "year", "month") 
                DO UPDATE SET "viewCount" = ${Number(stat.viewCount)}
            `

            successCount++
            console.log(`   ✅ Artwork ${stat.artworkId} - ${stat.month}/${stat.year}: ${stat.viewCount} vues agrégées`)
        } catch (error: any) {
            errorCount++
            console.error(`   ❌ Erreur pour Artwork ${stat.artworkId} - ${stat.month}/${stat.year}: ${error.message}`)
        }
    }

    console.log(`\n📊 Résumé des agrégations: ${successCount} créée(s), ${errorCount} erreur(s)`)
}

async function displayStatistics() {
    console.log('\n📈 Statistiques générées:\n')

    const totalViews = await prisma.physicalArtworkView.count()
    const totalStats = await prisma.physicalArtworkViewStat.count()

    const uniqueArtworksViews = await prisma.physicalArtworkView.groupBy({
        by: ['artworkId'],
        _count: true
    })

    const uniqueArtworksStats = await prisma.physicalArtworkViewStat.groupBy({
        by: ['artworkId'],
        _count: true
    })

    console.log(`  • Vues totales: ${totalViews.toLocaleString()}`)
    console.log(`  • Agrégations mensuelles: ${totalStats.toLocaleString()}`)
    console.log(
        `  • Artworks uniques (vues): ${uniqueArtworksViews.length}`
    )
    console.log(
        `  • Artworks uniques (stats): ${uniqueArtworksStats.length}`
    )

    // Aperçu des agrégations
    console.log('\n📋 Aperçu des agrégations (top 10):\n')
    const topStats = await prisma.physicalArtworkViewStat.findMany({
        orderBy: [
            { artworkId: 'asc' },
            { year: 'desc' },
            { month: 'desc' }
        ],
        take: 10
    })

    for (const stat of topStats) {
        console.log(
            `  Artwork ${stat.artworkId} - ${stat.month}/${stat.year}: ${stat.viewCount} vues`
        )
    }
}

// Exécuter le script
if (require.main === module) {
    seedPhysicalArtworkViews()
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

export { seedPhysicalArtworkViews }

