'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { unstable_noStore as noStore } from 'next/cache'

export interface LandingArtistData {
    intro?: string | null
    description?: string | null
    artworkStyle?: string | null
    artistsPage?: boolean | null
    imageUrl: string
    secondaryImageUrl?: string | null
    artworkImages?: string
    artistId?: number
    slug?: string
    categoryIds?: number[]
    // Champs Artist complémentaires
    quoteFromInRealArt?: string | null
    biographyHeader1?: string | null
    biographyText1?: string | null
    biographyHeader2?: string | null
    biographyText2?: string | null
    biographyHeader3?: string | null
    biographyText3?: string | null
    biographyHeader4?: string | null
    biographyText4?: string | null
    mediumTags?: string[]
    imageArtistStudio?: string | null
    onboardingBo?: Date | null
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
            artist: true,
            artistCategories: {
                include: {
                    category: true
                }
            }
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
                secondaryImageUrl: data.secondaryImageUrl,
                artworkImages: data.artworkImages || '[]',
                slug: data.slug!,
                // Nouveaux champs du modèle LandingArtist
                mediumTags: data.mediumTags || [],
                quoteFromInRealArt: data.quoteFromInRealArt,
                biographyHeader1: data.biographyHeader1,
                biographyText1: data.biographyText1,
                biographyHeader2: data.biographyHeader2,
                biographyText2: data.biographyText2,
                biographyHeader3: data.biographyHeader3,
                biographyText3: data.biographyText3,
                biographyHeader4: data.biographyHeader4,
                biographyText4: data.biographyText4,
                imageArtistStudio: data.imageArtistStudio,
            },
        })

        // Assurer que artworkImages est toujours un string
        return {
            success: true,
            landingArtist: {
                ...newLandingArtist,
                artworkImages: newLandingArtist.artworkImages ?
                    String(newLandingArtist.artworkImages) :
                    '[]'
            }
        }
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
                secondaryImageUrl: data.secondaryImageUrl,
                artworkImages: data.artworkImages || '[]',
                slug: data.slug,
                // Nouveaux champs du modèle LandingArtist
                mediumTags: data.mediumTags,
                quoteFromInRealArt: data.quoteFromInRealArt,
                biographyHeader1: data.biographyHeader1,
                biographyText1: data.biographyText1,
                biographyHeader2: data.biographyHeader2,
                biographyText2: data.biographyText2,
                biographyHeader3: data.biographyHeader3,
                biographyText3: data.biographyText3,
                biographyHeader4: data.biographyHeader4,
                biographyText4: data.biographyText4,
                imageArtistStudio: data.imageArtistStudio,
                onboardingBo: data.onboardingBo,
            },
        })

        // Assurer que artworkImages est toujours un string
        return {
            success: true,
            landingArtist: {
                ...updatedLandingArtist,
                artworkImages: updatedLandingArtist.artworkImages ?
                    String(updatedLandingArtist.artworkImages) :
                    '[]'
            }
        }
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
    // Forcer la récupération des données en temps réel sans cache
    noStore()

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
 * Gère les catégories d'artiste pour un LandingArtist
 */
async function handleArtistCategories(landingArtistId: number, categoryIds?: number[]) {
    if (categoryIds !== undefined) {
        // Supprimer toutes les catégories existantes
        await prisma.artistCategoryArtist.deleteMany({
            where: { landingArtistId }
        })

        // Créer les nouvelles relations de catégories
        if (categoryIds.length > 0) {
            await prisma.artistCategoryArtist.createMany({
                data: categoryIds.map(categoryId => ({
                    landingArtistId,
                    categoryId
                }))
            })
        }
    }
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

        // Créer le nouvel artiste landing
        const result = await createLandingArtist(formData)

        if (result.success && result.landingArtist) {
            // Gérer les catégories après la création
            await handleArtistCategories(result.landingArtist.id, formData.categoryIds)
        }

        // Revalider les chemins pour mettre à jour les données dans toutes les pages concernées
        revalidatePath('/landing/landingArtists')
        revalidatePath('/landing/landingArtists/create')

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

        // Mettre à jour l'artiste landing
        const result = await updateLandingArtist(id, formData)

        if (result.success && result.landingArtist) {
            // Gérer les catégories après la mise à jour
            await handleArtistCategories(result.landingArtist.id, formData.categoryIds)
        }

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

/**
 * Met à jour uniquement le champ onboardingBo d'un LandingArtist
 */
export async function updateLandingArtistOnboardingBo(
    landingArtistId: number,
    onboardingBo: Date | null
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.landingArtist.update({
            where: {
                id: landingArtistId,
            },
            data: {
                onboardingBo: onboardingBo,
            },
        })

        revalidatePath('/boAdmin/inventoryLanding')
        return {
            success: true,
        }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de onboardingBo:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour de la date d\'onboarding',
        }
    }
} 