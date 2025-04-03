'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface LandingArtistData {
    intro?: string | null
    description?: string | null
    artworkStyle?: string | null
    artistsPage?: boolean | null
    imageUrl: string
    artworkImages?: string
    artistId?: number
    websiteUrl?: string | null
    facebookUrl?: string | null
    instagramUrl?: string | null
    twitterUrl?: string | null
    linkedinUrl?: string | null
    slug?: string
}

/**
 * Récupère tous les artistes de la landing page avec leurs informations d'artiste
 */
export async function getAllLandingArtists() {
    return prisma.landingArtist.findMany({
        include: {
            artist: true
        },
        orderBy: {
            artist: {
                name: 'asc',
            },
        },
    })
}

/**
 * Récupère un artiste de la landing page par son ID
 */
export async function getLandingArtistById(id: number) {
    return prisma.landingArtist.findUnique({
        where: {
            id
        },
        include: {
            artist: true
        }
    })
}

/**
 * Crée un nouvel artiste sur la landing page
 */
export async function createLandingArtist(data: LandingArtistData) {
    try {
        const newLandingArtist = await prisma.landingArtist.create({
            data: {
                artistId: data.artistId!,
                intro: data.intro,
                description: data.description,
                artworkStyle: data.artworkStyle,
                artistsPage: data.artistsPage,
                imageUrl: data.imageUrl,
                artworkImages: data.artworkImages || '[]',
                websiteUrl: data.websiteUrl,
                facebookUrl: data.facebookUrl,
                instagramUrl: data.instagramUrl,
                twitterUrl: data.twitterUrl,
                linkedinUrl: data.linkedinUrl,
                slug: data.slug!,
            },
        })

        return { success: true, landingArtist: newLandingArtist }
    } catch (error: any) {
        console.error('Erreur lors de la création de l\'artiste landing:', error)
        return {
            success: false,
            message: error.code === 'P2002'
                ? 'Cet artiste est déjà présent sur la page d\'accueil'
                : 'Une erreur est survenue lors de la création de l\'artiste'
        }
    }
}

/**
 * Met à jour un artiste de la landing page
 */
export async function updateLandingArtist(id: number, data: LandingArtistData) {
    try {
        const updatedLandingArtist = await prisma.landingArtist.update({
            where: {
                id,
            },
            data: {
                intro: data.intro,
                description: data.description,
                artworkStyle: data.artworkStyle,
                artistsPage: data.artistsPage,
                imageUrl: data.imageUrl,
                artworkImages: data.artworkImages,
                websiteUrl: data.websiteUrl,
                facebookUrl: data.facebookUrl,
                instagramUrl: data.instagramUrl,
                twitterUrl: data.twitterUrl,
                linkedinUrl: data.linkedinUrl,
                slug: data.slug,
            },
        })

        return { success: true, landingArtist: updatedLandingArtist }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de l\'artiste landing:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour de l\'artiste'
        }
    }
}

/**
 * Récupère tous les artistes qui n'ont pas encore d'entrée dans la table LandingArtist
 */
export async function getArtistsNotInLanding() {
    return prisma.artist.findMany({
        where: {
            LandingArtist: {
                none: {}
            }
        },
        orderBy: {
            name: 'asc',
        },
    })
}

/**
 * Vérifie si un artiste existe
 */
export async function checkArtistExists(id: number) {
    const count = await prisma.artist.count({
        where: {
            id
        }
    })

    return count > 0
}

/**
 * Vérifie si un artiste est déjà dans la landing page
 */
export async function checkArtistInLanding(artistId: number) {
    const count = await prisma.landingArtist.count({
        where: {
            artistId
        }
    })

    return count > 0
}

/**
 * Crée un nouvel artiste sur la landing page (Server Action)
 */
export async function createLandingArtistAction(formData: LandingArtistData): Promise<{
    success: boolean;
    message?: string;
    landingArtist?: {
        id: number;
        artistId: number;
        intro: string | null;
        description: string | null;
        artworkStyle: string | null;
        artistsPage: boolean | null;
        imageUrl: string;
        artworkImages: string;
        websiteUrl: string | null;
        facebookUrl: string | null;
        instagramUrl: string | null;
        twitterUrl: string | null;
        linkedinUrl: string | null;
        slug: string;
    };
}> {
    try {
        // Vérification des données requises
        if (!formData.artistId || !formData.imageUrl || !formData.slug) {
            return {
                success: false,
                message: 'ID de l\'artiste, URL de l\'image et slug sont requis'
            }
        }

        // Vérifier si l'artiste existe
        const artistExists = await checkArtistExists(formData.artistId)
        if (!artistExists) {
            return {
                success: false,
                message: 'Artiste non trouvé'
            }
        }

        // Vérifier si l'artiste est déjà présent dans la table LandingArtist
        const artistInLanding = await checkArtistInLanding(formData.artistId)
        if (artistInLanding) {
            return {
                success: false,
                message: 'Cet artiste est déjà présent sur la page d\'accueil'
            }
        }

        // Créer le nouvel artiste
        const result = await createLandingArtist(formData)

        // Revalider le chemin pour mettre à jour les données
        revalidatePath('/landing/landingArtists')

        return result
    } catch (error: any) {
        console.error('Erreur lors de la création de l\'artiste landing:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la création de l\'artiste'
        }
    }
}

/**
 * Met à jour un artiste de la landing page (Server Action)
 */
export async function updateLandingArtistAction(id: number, formData: LandingArtistData): Promise<{
    success: boolean;
    message?: string;
    landingArtist?: {
        id: number;
        artistId: number;
        intro: string | null;
        description: string | null;
        artworkStyle: string | null;
        artistsPage: boolean | null;
        imageUrl: string;
        artworkImages: string;
        websiteUrl: string | null;
        facebookUrl: string | null;
        instagramUrl: string | null;
        twitterUrl: string | null;
        linkedinUrl: string | null;
        slug: string;
    };
}> {
    try {
        // Vérification des données requises
        if (!formData.imageUrl) {
            return {
                success: false,
                message: 'URL de l\'image requise'
            }
        }

        // Vérifier si l'artiste existe
        const existingLandingArtist = await getLandingArtistById(id)
        if (!existingLandingArtist) {
            return {
                success: false,
                message: 'Artiste non trouvé'
            }
        }

        // Si le slug n'est pas fourni, conserver celui existant
        if (!formData.slug) {
            formData.slug = existingLandingArtist.slug
        }

        // Mettre à jour l'artiste
        const result = await updateLandingArtist(id, formData)

        // Revalider le chemin pour mettre à jour les données
        revalidatePath('/landing/landingArtists')

        return result
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de l\'artiste landing:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour de l\'artiste'
        }
    }
} 