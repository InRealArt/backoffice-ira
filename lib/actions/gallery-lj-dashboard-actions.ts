'use server'

import { prisma } from '@/lib/prisma'

export interface GalleryLjArtistMetrics {
  total: number
  permanent: number
  temporary: number
}

export interface GalleryLjArtworkMetrics {
  total: number
  visible: number
  hidden: number
}

export interface GalleryLjExhibitionMetrics {
  total: number
  upcoming: number
  ongoing: number
  past: number
}

/**
 * Métriques pour les artistes de la galerie LJ
 */
export async function getGalleryLjArtistMetrics(): Promise<GalleryLjArtistMetrics> {
  try {
    const [total, permanent] = await Promise.all([
      prisma.galleryLjArtist.count(),
      prisma.galleryLjArtist.count({ where: { permanent: true } }),
    ])
    return { total, permanent, temporary: total - permanent }
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques artistes galerie LJ:', error)
    return { total: 0, permanent: 0, temporary: 0 }
  }
}

/**
 * Métriques pour les œuvres de la galerie LJ
 */
export async function getGalleryLjArtworkMetrics(): Promise<GalleryLjArtworkMetrics> {
  try {
    const [total, visible] = await Promise.all([
      prisma.galleryLjArtwork.count(),
      prisma.galleryLjArtwork.count({ where: { visible: true } }),
    ])
    return { total, visible, hidden: total - visible }
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques œuvres galerie LJ:', error)
    return { total: 0, visible: 0, hidden: 0 }
  }
}

/**
 * Métriques pour les expositions de la galerie LJ
 * - upcoming : startDate > now (ou startDate null)
 * - ongoing  : startDate <= now && (endDate >= now ou endDate null)
 * - past     : endDate < now
 */
export async function getGalleryLjExhibitionMetrics(): Promise<GalleryLjExhibitionMetrics> {
  try {
    const now = new Date()

    const [total, upcoming, ongoing, past] = await Promise.all([
      prisma.galleryLjEvent.count(),
      // À venir : startDate dans le futur (ou non définie — pas encore planifiée)
      prisma.galleryLjEvent.count({
        where: { startDate: { gt: now } },
      }),
      // En cours : startDate <= now ET (endDate >= now ou endDate null)
      prisma.galleryLjEvent.count({
        where: {
          startDate: { lte: now },
          OR: [
            { endDate: { gte: now } },
            { endDate: null },
          ],
        },
      }),
      // Passées : endDate < now
      prisma.galleryLjEvent.count({
        where: { endDate: { lt: now } },
      }),
    ])

    return { total, upcoming, ongoing, past }
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques expositions galerie LJ:', error)
    return { total: 0, upcoming: 0, ongoing: 0, past: 0 }
  }
}
