'use server'

import { UmamiApiClient } from '@umami/api-client'
import { stringToSlug } from '@/lib/utils'

/**
 * Configuration du client Umami
 * Utilise Umami Cloud avec une clé API
 * Documentation: https://umami.is/docs/cloud/api-key
 */
function getUmamiClient() {
    // Pour Umami Cloud, utiliser UMAMI_API_CLIENT_ENDPOINT
    // Sinon, utiliser UMAMI_API_ENDPOINT pour une instance auto-hébergée
    const apiEndpoint =
        process.env.UMAMI_API_CLIENT_ENDPOINT ||
        process.env.UMAMI_API_ENDPOINT ||
        'https://api.umami.is/v1'
    const apiKey = process.env.UMAMI_API_KEY

    if (!apiKey) {
        throw new Error('UMAMI_API_KEY n\'est pas configuré')
    }

    const client = new UmamiApiClient({
        apiEndpoint,
        apiKey
    })

    return client
}

/**
 * Récupère les statistiques Umami pour une page spécifique
 * @param slug - Le slug de l'œuvre (ex: "mon-oeuvre")
 * @param startAt - Date de début (timestamp Unix, optionnel)
 * @param endAt - Date de fin (timestamp Unix, optionnel)
 */
export async function getUmamiStatsForArtwork(
    slug: string,
    startAt?: number,
    endAt?: number
) {
    try {
        const client = getUmamiClient()
        const websiteId = process.env.UMAMI_WEBSITE_ID

        if (!websiteId) {
            return {
                success: false,
                error: 'UMAMI_WEBSITE_ID n\'est pas configuré'
            }
        }

        // Construire l'URL de la page
        const pageUrl = `/artwork/${slug}`

        // Par défaut, récupérer les stats des 30 derniers jours
        const defaultStartAt = startAt || Date.now() - 30 * 24 * 60 * 60 * 1000
        const defaultEndAt = endAt || Date.now()

        // IMPORTANT: Dans Umami Cloud, le paramètre correct est 'path' et non 'url'
        // Utiliser executeRoute avec le paramètre 'path' pour filtrer par URL
        const statsResult = await client.executeRoute(
            `websites/${websiteId}/stats`,
            'GET',
            {
                startAt: defaultStartAt,
                endAt: defaultEndAt,
                path: pageUrl  // Utiliser 'path' au lieu de 'url'
            }
        )

        let stats = null

        if (statsResult.ok && statsResult.data) {
            const data = statsResult.data
            stats = {
                pageviews: { value: data.pageviews || 0, delta: data.comparison?.pageviews || 0 },
                visitors: { value: data.visitors || 0, delta: data.comparison?.visitors || 0 },
                visits: { value: data.visits || 0, delta: data.comparison?.visits || 0 },
                bounces: { value: data.bounces || 0, delta: data.comparison?.bounces || 0 },
                totaltime: { value: data.totaltime || 0, delta: data.comparison?.totaltime || 0 }
            }
        }

        // Récupérer les pageviews détaillés avec le paramètre 'path'
        const pageviewsResult = await client.executeRoute(
            `websites/${websiteId}/pageviews`,
            'GET',
            {
                startAt: defaultStartAt,
                endAt: defaultEndAt,
                unit: 'day',
                timezone: 'Europe/Paris',
                path: pageUrl  // Utiliser 'path' au lieu de 'url'
            }
        )

        return {
            success: true,
            data: {
                stats: stats,
                pageviews: pageviewsResult?.ok ? pageviewsResult.data : null,
                pageUrl: pageUrl
            }
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des stats Umami:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        }
    }
}

/**
 * Récupère les statistiques mensuelles pour une œuvre
 * @param slug - Le slug de l'œuvre
 */
export async function getUmamiMonthlyStatsForArtwork(slug: string) {
    try {
        const client = getUmamiClient()
        const websiteId = process.env.UMAMI_WEBSITE_ID

        if (!websiteId) {
            return {
                success: false,
                error: 'UMAMI_WEBSITE_ID n\'est pas configuré'
            }
        }

        const pageUrl = `/artwork/${slug}`

        // Récupérer les stats des 12 derniers mois
        const endAt = Date.now()
        const startAt = Date.now() - 365 * 24 * 60 * 60 * 1000

        // Récupérer les pageviews par jour avec le paramètre 'path'
        const pageviewsResult = await client.executeRoute(
            `websites/${websiteId}/pageviews`,
            'GET',
            {
                startAt,
                endAt,
                unit: 'day',
                timezone: 'Europe/Paris',
                path: pageUrl  // Utiliser 'path' au lieu de 'url'
            }
        )

        if (!pageviewsResult.ok) {
            return {
                success: false,
                error: pageviewsResult.error?.message || 'Erreur lors de la récupération des statistiques'
            }
        }

        // Grouper les données par mois
        const monthlyData = groupPageviewsByMonth(pageviewsResult.data?.pageviews || [])

        return {
            success: true,
            data: monthlyData
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des stats mensuelles Umami:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        }
    }
}

/**
 * Groupe les pageviews par mois
 */
function groupPageviewsByMonth(
    pageviews: Array<{ x?: string; t?: string; y: number }>
): Array<{
    year: number
    month: number
    viewCount: number
    monthLabel: string
}> {
    if (!pageviews || !Array.isArray(pageviews)) {
        return []
    }

    const monthlyMap = new Map<string, number>()

    pageviews.forEach((pageview) => {
        // Support des deux formats : 'x' ou 't' pour la date
        const dateString = pageview.x || pageview.t
        if (dateString && pageview.y !== undefined) {
            const date = new Date(dateString)
            const year = date.getFullYear()
            const month = date.getMonth() + 1
            const key = `${year}-${month.toString().padStart(2, '0')}`

            monthlyMap.set(key, (monthlyMap.get(key) || 0) + pageview.y)
        }
    })

    const monthlyData = Array.from(monthlyMap.entries())
        .map(([key, viewCount]) => {
            const [year, month] = key.split('-').map(Number)
            const date = new Date(year, month - 1, 1)
            const monthLabel = date.toLocaleDateString('fr-FR', {
                month: 'long',
                year: 'numeric'
            })

            return {
                year,
                month,
                viewCount,
                monthLabel
            }
        })
        .sort((a, b) => {
            if (a.year !== b.year) {
                return a.year - b.year
            }
            return a.month - b.month
        })

    return monthlyData
}

/**
 * Génère un slug à partir du nom d'une œuvre PresaleArtwork
 * Utilise la même fonction que le site web (stringToSlug) pour garantir la correspondance
 * Note: Cette fonction doit être async car elle est exportée comme Server Action
 */
export async function generateArtworkSlug(name: string): Promise<string> {
    return stringToSlug(name)
}

