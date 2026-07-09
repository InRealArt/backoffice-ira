'use server'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { unstable_noStore as noStore } from 'next/cache'
import { toRelativePath } from '@/lib/r2/url'

/**
 * Récupère toutes les fiches Artitude avec leurs informations d'artiste et images.
 * latitude/longitude (Decimal Prisma) sont converties en number pour rester
 * sérialisables vers le Client Component qui consomme ces données.
 */
export async function getAllArtitudeArtists() {
    const artitudeArtists = await prisma.artitudeArtist.findMany({
        include: {
            artist: true,
            images: true,
            Country: true
        },
        orderBy: {
            artist: {
                name: 'asc',
            },
        },
    })

    return artitudeArtists.map((artitudeArtist) => ({
        ...artitudeArtist,
        latitude: artitudeArtist.latitude ? Number(artitudeArtist.latitude) : null,
        longitude: artitudeArtist.longitude ? Number(artitudeArtist.longitude) : null,
    }))
}

/**
 * Récupère une fiche Artitude par son id, avec l'artiste et les images associées.
 * latitude/longitude (Decimal Prisma) sont converties en number pour rester
 * sérialisables vers le Client Component qui consomme ces données.
 */
export async function getArtitudeArtistById(id: number) {
    noStore()

    const artitudeArtist = await prisma.artitudeArtist.findUnique({
        where: { id },
        include: {
            artist: true,
            images: true,
            Country: true
        }
    })

    if (!artitudeArtist) return null

    return {
        ...artitudeArtist,
        latitude: artitudeArtist.latitude ? Number(artitudeArtist.latitude) : null,
        longitude: artitudeArtist.longitude ? Number(artitudeArtist.longitude) : null,
    }
}

/**
 * Récupère tous les artistes qui n'ont pas encore de fiche ArtitudeArtist
 */
export async function getArtistsNotInArtitude() {
    noStore()

    return prisma.artist.findMany({
        where: {
            artitudeArtist: null
        },
        orderBy: {
            name: 'asc',
        },
    })
}

export interface OpeningHoursPeriod {
    day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
    openTime: string
    closeTime: string
}

export interface ArtitudeArtistData {
    artistId: number
    addressLine1: string
    addressLine2?: string | null
    postalCode: string
    city: string
    countryCode?: string | null
    latitude?: number | null
    longitude?: number | null
    phoneNumber?: string | null
    websiteUrl?: string | null
    googleBusinessProfileUrl: string
    openingHours?: OpeningHoursPeriod[] | null
    coverImage?: string | null
    interiorImages: string[]
    exteriorImages: string[]
    artistImages: string[]
    otherImages: string[]
}

export interface GeocodedCoordinates {
    latitude: number
    longitude: number
}

/**
 * Géocode une adresse française via l'API Adresse (BAN, data.gouv.fr) — gratuite, sans clé.
 * Retourne null si l'adresse n'est pas trouvée ou en cas d'erreur réseau, sans jamais lever
 * d'exception : le géocodage est une amélioration, pas une condition bloquante de création.
 */
async function geocodeAddress(
    addressLine1: string,
    postalCode: string,
    city: string
): Promise<GeocodedCoordinates | null> {
    try {
        const query = `${addressLine1} ${postalCode} ${city}`.trim()
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`

        const response = await fetch(url)
        if (!response.ok) return null

        const result = await response.json()
        const feature = result?.features?.[0]
        const coordinates = feature?.geometry?.coordinates

        if (!Array.isArray(coordinates) || coordinates.length !== 2) return null

        const [longitude, latitude] = coordinates
        if (typeof latitude !== 'number' || typeof longitude !== 'number') return null

        return { latitude, longitude }
    } catch (error) {
        console.error('Erreur lors du géocodage de l\'adresse:', error)
        return null
    }
}

/**
 * Géocode une adresse française (server action appelable côté client) pour affichage
 * live latitude/longitude pendant la saisie du formulaire.
 */
export async function geocodeAddressAction(
    addressLine1: string,
    postalCode: string,
    city: string
): Promise<GeocodedCoordinates | null> {
    if (!addressLine1 || !postalCode || !city) return null
    return geocodeAddress(addressLine1, postalCode, city)
}

/**
 * Crée une fiche Artitude (ArtitudeArtist + ArtitudeArtistImages) pour un artiste existant
 */
export async function createArtitudeArtistAction(data: ArtitudeArtistData): Promise<{
    success: boolean
    message?: string
    artitudeArtist?: { id: number }
}> {
    try {
        if (!data.artistId || !data.addressLine1 || !data.postalCode || !data.city || !data.googleBusinessProfileUrl) {
            return {
                success: false,
                message: 'Artiste, adresse, ville, code postal et lien de la fiche établissement Google sont requis'
            }
        }

        const artistExists = await withPrismaRetry(() =>
            prisma.artist.findUnique({ where: { id: data.artistId } })
        )
        if (!artistExists) {
            return { success: false, message: 'Artiste non trouvé' }
        }

        const existingArtitude = await withPrismaRetry(() =>
            prisma.artitudeArtist.findUnique({ where: { artistId: data.artistId } })
        )
        if (existingArtitude) {
            return { success: false, message: 'Cet artiste a déjà une fiche Artitude' }
        }

        // Si le client a déjà fourni des coordonnées (géocodage live ou saisie manuelle),
        // on les utilise telles quelles. Sinon on retente le géocodage côté serveur en secours.
        const coordinates =
            typeof data.latitude === 'number' && typeof data.longitude === 'number'
                ? { latitude: data.latitude, longitude: data.longitude }
                : await geocodeAddress(data.addressLine1, data.postalCode, data.city)

        const artitudeArtist = await withPrismaRetry(() =>
            prisma.artitudeArtist.create({
                data: {
                    artistId: data.artistId,
                    addressLine1: data.addressLine1,
                    addressLine2: data.addressLine2 || null,
                    postalCode: data.postalCode,
                    city: data.city,
                    countryCode: data.countryCode || null,
                    latitude: coordinates?.latitude ?? null,
                    longitude: coordinates?.longitude ?? null,
                    phoneNumber: data.phoneNumber || null,
                    websiteUrl: data.websiteUrl || null,
                    googleBusinessProfileUrl: data.googleBusinessProfileUrl,
                    openingHours: data.openingHours && data.openingHours.length > 0 ? (data.openingHours as any) : undefined,
                    images: {
                        create: {
                            coverImage: toRelativePath(data.coverImage ?? null),
                            interiorImages: data.interiorImages.map(p => toRelativePath(p) ?? p),
                            exteriorImages: data.exteriorImages.map(p => toRelativePath(p) ?? p),
                            artistImages: data.artistImages.map(p => toRelativePath(p) ?? p),
                            otherImages: data.otherImages.map(p => toRelativePath(p) ?? p),
                        }
                    }
                }
            })
        )

        revalidatePath('/landing/indexArtitude')
        revalidatePath('/landing/indexArtitude/create')

        return { success: true, artitudeArtist: { id: artitudeArtist.id } }
    } catch (error: any) {
        console.error('Erreur lors de la création de la fiche Artitude:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la création de la fiche Artitude'
        }
    }
}

export interface ArtitudeArtistUpdateData {
    addressLine1: string
    addressLine2?: string | null
    postalCode: string
    city: string
    countryCode?: string | null
    latitude?: number | null
    longitude?: number | null
    phoneNumber?: string | null
    websiteUrl?: string | null
    googleBusinessProfileUrl: string
    openingHours?: OpeningHoursPeriod[] | null
    isActive?: boolean
    coverImage?: string | null
    interiorImages: string[]
    exteriorImages: string[]
    artistImages: string[]
    otherImages: string[]
}

/**
 * Met à jour une fiche Artitude existante (ArtitudeArtist + ArtitudeArtistImages)
 */
export async function updateArtitudeArtistAction(
    id: number,
    data: ArtitudeArtistUpdateData
): Promise<{
    success: boolean
    message?: string
}> {
    try {
        if (!data.addressLine1 || !data.postalCode || !data.city || !data.googleBusinessProfileUrl) {
            return {
                success: false,
                message: 'Adresse, ville, code postal et lien de la fiche établissement Google sont requis'
            }
        }

        const existingArtitude = await withPrismaRetry(() =>
            prisma.artitudeArtist.findUnique({ where: { id } })
        )
        if (!existingArtitude) {
            return { success: false, message: 'Fiche Artitude non trouvée' }
        }

        // Si le client a déjà fourni des coordonnées (géocodage live ou saisie manuelle),
        // on les utilise telles quelles. Sinon on retente le géocodage côté serveur en secours.
        const coordinates =
            typeof data.latitude === 'number' && typeof data.longitude === 'number'
                ? { latitude: data.latitude, longitude: data.longitude }
                : await geocodeAddress(data.addressLine1, data.postalCode, data.city)

        await withPrismaRetry(() =>
            prisma.artitudeArtist.update({
                where: { id },
                data: {
                    addressLine1: data.addressLine1,
                    addressLine2: data.addressLine2 || null,
                    postalCode: data.postalCode,
                    city: data.city,
                    countryCode: data.countryCode || null,
                    latitude: coordinates?.latitude ?? null,
                    longitude: coordinates?.longitude ?? null,
                    phoneNumber: data.phoneNumber || null,
                    websiteUrl: data.websiteUrl || null,
                    googleBusinessProfileUrl: data.googleBusinessProfileUrl,
                    openingHours: data.openingHours && data.openingHours.length > 0 ? (data.openingHours as any) : undefined,
                    isActive: data.isActive,
                    images: {
                        upsert: {
                            create: {
                                coverImage: toRelativePath(data.coverImage ?? null),
                                interiorImages: data.interiorImages.map(p => toRelativePath(p) ?? p),
                                exteriorImages: data.exteriorImages.map(p => toRelativePath(p) ?? p),
                                artistImages: data.artistImages.map(p => toRelativePath(p) ?? p),
                                otherImages: data.otherImages.map(p => toRelativePath(p) ?? p),
                            },
                            update: {
                                coverImage: toRelativePath(data.coverImage ?? null),
                                interiorImages: data.interiorImages.map(p => toRelativePath(p) ?? p),
                                exteriorImages: data.exteriorImages.map(p => toRelativePath(p) ?? p),
                                artistImages: data.artistImages.map(p => toRelativePath(p) ?? p),
                                otherImages: data.otherImages.map(p => toRelativePath(p) ?? p),
                            }
                        }
                    }
                }
            })
        )

        revalidatePath('/landing/indexArtitude')
        revalidatePath(`/landing/indexArtitude/${id}/edit`)

        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de la fiche Artitude:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour de la fiche Artitude'
        }
    }
}
