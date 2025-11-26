'use server'

import { prisma } from '@/lib/prisma'
import { Artist, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { generateSlug, toCamelCase, getCountries } from '@/lib/utils'

export async function getArtistById(id: number): Promise<Artist | null> {
    try {
        return await prisma.artist.findUnique({
            where: { id }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'artiste:', error)
        return null
    }
}

/**
 * S'assure que le pays existe dans la base de données
 * Le crée s'il n'existe pas
 */
async function ensureCountryExists(countryCode: string | null | undefined): Promise<void> {
    if (!countryCode) return

    // Vérifier si le pays existe déjà
    const existingCountry = await prisma.country.findUnique({
        where: { code: countryCode }
    })

    if (!existingCountry) {
        // Trouver le nom du pays dans la liste statique
        const countries = getCountries()
        const country = countries.find(c => c.code === countryCode)

        if (country) {
            // Créer le pays dans la base de données
            await prisma.country.create({
                data: {
                    code: country.code,
                    name: country.name
                }
            })
        } else {
            throw new Error(`Code pays invalide: ${countryCode}`)
        }
    }
}

export async function updateArtist(
    id: number,
    data: Prisma.ArtistUpdateInput
): Promise<{ success: boolean; message?: string }> {
    try {
        // S'assurer que le pays existe dans la base de données avant de sauvegarder
        // Extraire countryCode de manière sûre depuis Prisma.ArtistUpdateInput
        const dataWithCountryCode = data as Prisma.ArtistUpdateInput & { countryCode?: string | null | { set?: string | null } }
        const countryCodeValue = dataWithCountryCode.countryCode
            ? (typeof dataWithCountryCode.countryCode === 'string'
                ? dataWithCountryCode.countryCode
                : typeof dataWithCountryCode.countryCode === 'object' && dataWithCountryCode.countryCode !== null && 'set' in dataWithCountryCode.countryCode
                    ? dataWithCountryCode.countryCode.set ?? null
                    : null)
            : null

        if (countryCodeValue) {
            await ensureCountryExists(countryCodeValue)
        }

        // Filtrer les champs autorisés pour éviter les erreurs Prisma
        const allowedData = {
            name: data.name,
            surname: data.surname,
            pseudo: data.pseudo,
            description: data.description,
            publicKey: data.publicKey,
            imageUrl: data.imageUrl,
            isGallery: data.isGallery,
            backgroundImage: data.backgroundImage,
            slug: data.slug,
            featuredArtwork: data.featuredArtwork,
            birthYear: data.birthYear,
            countryCode: dataWithCountryCode.countryCode,
            websiteUrl: data.websiteUrl,
            facebookUrl: data.facebookUrl,
            instagramUrl: data.instagramUrl,
            twitterUrl: data.twitterUrl,
            linkedinUrl: data.linkedinUrl,
        } as Prisma.ArtistUpdateInput

        // Mise à jour de l'artiste
        await prisma.artist.update({
            where: { id },
            data: allowedData
        })

        revalidatePath(`/dataAdministration/artists`)
        revalidatePath(`/dataAdministration/artists/${id}/edit`)

        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de l\'artiste:', error)

        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'Un champ'
            return {
                success: false,
                message: `${field} est déjà utilisé. Veuillez en choisir un autre.`
            }
        }

        if (error.code === 'P2003') {
            return {
                success: false,
                message: 'Le code pays sélectionné n\'existe pas dans la base de données. Veuillez sélectionner un pays valide.'
            }
        }

        return {
            success: false,
            message: error.message || 'Une erreur est survenue lors de la mise à jour.'
        }
    }
}

export interface CreateArtistData {
    name: string
    surname: string
    pseudo: string
    description: string
    artistsPage?: boolean
    publicKey?: string
    imageUrl?: string
    isGallery?: boolean
    backgroundImage?: string | null
    // Nouveaux champs biographie
    birthYear?: number | null
    countryCode?: string | null
    // Nouveaux champs réseaux sociaux
    websiteUrl?: string | null
    facebookUrl?: string | null
    instagramUrl?: string | null
    twitterUrl?: string | null
    linkedinUrl?: string | null
}

/**
 * Crée un nouvel artiste
 */
export async function createArtist(data: CreateArtistData): Promise<{ success: boolean; message?: string; artist?: Artist }> {
    try {
        console.log('data', data)
        // Vérifier si le pseudo est déjà utilisé
        const existingArtist = await prisma.artist.findFirst({
            where: {
                pseudo: data.pseudo
            }
        })

        if (existingArtist) {
            return {
                success: false,
                message: 'Ce pseudo est déjà utilisé'
            }
        }

        // S'assurer que le pays existe dans la base de données avant de créer
        if (data.countryCode) {
            await ensureCountryExists(data.countryCode)
        }

        const { artistsPage, ...prismaDataPartial } = data

        // Préparer les données avec des valeurs par défaut pour les champs obligatoires
        const prismaData = {
            ...prismaDataPartial,
            publicKey: data.publicKey || `default-${Date.now()}`,
            imageUrl: data.imageUrl || '',
            isGallery: data.isGallery || false,
            backgroundImage: data.backgroundImage || null,
            // Nouveaux champs biographie
            birthYear: data.birthYear || null,
            countryCode: data.countryCode || null,
            // Nouveaux champs réseaux sociaux
            websiteUrl: data.websiteUrl || null,
            facebookUrl: data.facebookUrl || null,
            instagramUrl: data.instagramUrl || null,
            twitterUrl: data.twitterUrl || null,
            linkedinUrl: data.linkedinUrl || null
        }

        // Créer l'artiste
        const artist = await prisma.artist.create({
            data: prismaData
        })

        revalidatePath('/dataAdministration/artists')

        return {
            success: true,
            artist
        }
    } catch (error: any) {
        console.error('Erreur lors de la création de l\'artiste:', error)

        if (error.code === 'P2002') {
            return {
                success: false,
                message: 'Un champ unique est déjà utilisé'
            }
        }

        if (error.code === 'P2003') {
            return {
                success: false,
                message: 'Le code pays sélectionné n\'existe pas dans la base de données. Veuillez sélectionner un pays valide.'
            }
        }

        return {
            success: false,
            message: error.message || 'Une erreur est survenue lors de la création de l\'artiste'
        }
    }
}

/**
 * Crée un profil artiste complet (Artist + LandingArtist) et l'associe à un utilisateur
 */
export async function createUserArtistProfile(
    formData: FormData
): Promise<{ success: boolean; message?: string; artist?: Artist }> {
    try {
        // Extraire les données du FormData
        const imageUrl = formData.get('imageUrl') as string // ← Recevoir l'URL au lieu du fichier
        const name = formData.get('name') as string
        const surname = formData.get('surname') as string
        const pseudo = formData.get('pseudo') as string
        const description = formData.get('description') as string
        const userEmail = formData.get('userEmail') as string
        const birthYear = formData.get('birthYear') ? parseInt(formData.get('birthYear') as string) : null
        const countryCode = formData.get('countryCode') as string | null
        const websiteUrl = formData.get('websiteUrl') as string | null
        const facebookUrl = formData.get('facebookUrl') as string | null
        const instagramUrl = formData.get('instagramUrl') as string | null
        const twitterUrl = formData.get('twitterUrl') as string | null
        const linkedinUrl = formData.get('linkedinUrl') as string | null
        const artistsPage = formData.get('artistsPage') === 'true'

        // Nouveaux champs optionnels
        const secondaryImageUrl = formData.get('secondaryImageUrl') as string | null
        const imageArtistStudio = formData.get('imageArtistStudio') as string | null
        const biographyHeader1 = formData.get('biographyHeader1') as string | null
        const biographyText1 = formData.get('biographyText1') as string | null
        const biographyHeader2 = formData.get('biographyHeader2') as string | null
        const biographyText2 = formData.get('biographyText2') as string | null
        const biographyHeader3 = formData.get('biographyHeader3') as string | null
        const biographyText3 = formData.get('biographyText3') as string | null
        const biographyHeader4 = formData.get('biographyHeader4') as string | null
        const biographyText4 = formData.get('biographyText4') as string | null

        if (!imageUrl) {
            return {
                success: false,
                message: 'Une photo de profil est requise'
            }
        }
        // Vérifier si le pseudo est déjà utilisé
        const existingArtist = await prisma.artist.findFirst({
            where: {
                pseudo: pseudo
            }
        })

        if (existingArtist) {
            return {
                success: false,
                message: 'Ce pseudo est déjà utilisé'
            }
        }

        // Vérifier que l'utilisateur existe et a le rôle artist
        const user = await prisma.whiteListedUser.findUnique({
            where: { email: userEmail }
        })

        if (!user) {
            return {
                success: false,
                message: 'Utilisateur non trouvé'
            }
        }

        if (user.role !== 'artist') {
            return {
                success: false,
                message: 'Seuls les utilisateurs avec le rôle "artist" peuvent créer un profil artiste'
            }
        }

        if (user.artistId) {
            return {
                success: false,
                message: 'Vous avez déjà un profil artiste associé'
            }
        }

        // Générer le slug à partir du pseudo
        const slug = generateSlug(pseudo)

        // Vérifier que le slug n'existe pas déjà
        const existingSlug = await prisma.landingArtist.findFirst({
            where: { slug }
        })

        if (existingSlug) {
            return {
                success: false,
                message: 'Ce pseudo génère un slug déjà utilisé. Veuillez choisir un autre pseudo.'
            }
        }

        // Créer l'artiste dans la table Artist
        const artist = await prisma.artist.create({
            data: {
                name: name,
                surname: surname,
                pseudo: pseudo,
                description: description,
                imageUrl: imageUrl,
                publicKey: `default-${Date.now()}`,
                isGallery: false,
                birthYear: birthYear || null,
                countryCode: countryCode || null,
                websiteUrl: websiteUrl || null,
                facebookUrl: facebookUrl || null,
                instagramUrl: instagramUrl || null,
                twitterUrl: twitterUrl || null,
                linkedinUrl: linkedinUrl || null
            }
        })

        // Créer le LandingArtist avec les mêmes description et imageUrl
        // Duplication des champs description et imageUrl comme demandé
        await prisma.landingArtist.create({
            data: {
                artistId: artist.id,
                slug: slug,
                description: description,
                imageUrl: imageUrl,
                artistsPage: artistsPage,
                artworkImages: '[]',
                // Nouveaux champs optionnels
                secondaryImageUrl: secondaryImageUrl || null,
                imageArtistStudio: imageArtistStudio || null,
                biographyHeader1: biographyHeader1 || null,
                biographyText1: biographyText1 || null,
                biographyHeader2: biographyHeader2 || null,
                biographyText2: biographyText2 || null,
                biographyHeader3: biographyHeader3 || null,
                biographyText3: biographyText3 || null,
                biographyHeader4: biographyHeader4 || null,
                biographyText4: biographyText4 || null
            }
        })

        // Mettre à jour WhiteListedUser pour associer l'artiste
        await prisma.whiteListedUser.update({
            where: { email: userEmail },
            data: { artistId: artist.id }
        })

        // Mettre à jour BackofficeAuthUser pour associer l'artiste
        // (nécessaire pour l'affichage sur le dashboard)
        await prisma.backofficeAuthUser.update({
            where: { email: userEmail },
            data: { artistId: artist.id }
        })

        // Revalider les chemins
        revalidatePath('/dataAdministration/artists')
        revalidatePath('/landing/landingArtists')
        revalidatePath('/dashboard')

        return {
            success: true,
            artist
        }
    } catch (error: any) {
        console.error('Erreur lors de la création du profil artiste:', error)
        return {
            success: false,
            message: error.code === 'P2002'
                ? 'Un champ unique est déjà utilisé'
                : 'Une erreur est survenue lors de la création du profil artiste'
        }
    }
}

/**
 * Récupère le LandingArtist associé à un artistId
 */
export async function getLandingArtistByArtistId(artistId: number) {
    try {
        return await prisma.landingArtist.findFirst({
            where: { artistId },
            include: {
                artist: true
            }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération du LandingArtist:', error)
        return null
    }
}

/**
 * Met à jour un profil artiste utilisateur (Artist + LandingArtist)
 */
export async function updateUserArtistProfile(
    formData: FormData
): Promise<{ success: boolean; message?: string; artist?: Artist }> {
    try {
        // Extraire les données du FormData
        const artistId = formData.get('artistId') ? parseInt(formData.get('artistId') as string) : null
        const imageUrl = formData.get('imageUrl') as string
        const pseudo = formData.get('pseudo') as string
        const description = formData.get('description') as string
        const birthYearValue = formData.get('birthYear') as string
        const birthYear = birthYearValue && birthYearValue.trim() !== '' ? parseInt(birthYearValue) : null
        const countryCodeValue = formData.get('countryCode') as string
        const countryCode = countryCodeValue && countryCodeValue.trim() !== '' ? countryCodeValue : null
        const websiteUrl = formData.get('websiteUrl') as string | null
        const facebookUrl = formData.get('facebookUrl') as string | null
        const instagramUrl = formData.get('instagramUrl') as string | null
        const twitterUrl = formData.get('twitterUrl') as string | null
        const linkedinUrl = formData.get('linkedinUrl') as string | null
        const artistsPage = formData.get('artistsPage') === 'true'

        // Flags de suppression d'images
        const deleteMainImage = formData.get('deleteMainImage') === 'true'
        const deleteSecondaryImage = formData.get('deleteSecondaryImage') === 'true'
        const deleteStudioImage = formData.get('deleteStudioImage') === 'true'

        // Nouveaux champs optionnels
        const secondaryImageUrl = formData.get('secondaryImageUrl') as string | null
        const imageArtistStudio = formData.get('imageArtistStudio') as string | null
        const biographyHeader1 = formData.get('biographyHeader1') as string | null
        const biographyText1 = formData.get('biographyText1') as string | null
        const biographyHeader2 = formData.get('biographyHeader2') as string | null
        const biographyText2 = formData.get('biographyText2') as string | null
        const biographyHeader3 = formData.get('biographyHeader3') as string | null
        const biographyText3 = formData.get('biographyText3') as string | null
        const biographyHeader4 = formData.get('biographyHeader4') as string | null
        const biographyText4 = formData.get('biographyText4') as string | null

        if (!artistId) {
            return {
                success: false,
                message: 'ID artiste requis'
            }
        }

        // Vérifier que l'artiste existe
        const existingArtist = await prisma.artist.findUnique({
            where: { id: artistId }
        })

        if (!existingArtist) {
            return {
                success: false,
                message: 'Artiste non trouvé'
            }
        }

        // Si l'image principale doit être supprimée, on ne peut pas continuer sans nouvelle image
        if (deleteMainImage && !imageUrl) {
            return {
                success: false,
                message: 'Vous devez fournir une nouvelle photo de profil si vous supprimez l\'actuelle'
            }
        }

        // Si pas de nouvelle image et pas de suppression, utiliser l'image existante
        let finalImageUrl = imageUrl
        if (!imageUrl && !deleteMainImage) {
            finalImageUrl = existingArtist.imageUrl
        }

        // Vérifier si le pseudo est déjà utilisé par un autre artiste
        if (pseudo !== existingArtist.pseudo) {
            const pseudoExists = await prisma.artist.findFirst({
                where: {
                    pseudo: pseudo,
                    id: { not: artistId }
                }
            })

            if (pseudoExists) {
                return {
                    success: false,
                    message: 'Ce pseudo est déjà utilisé'
                }
            }
        }

        // Supprimer l'image principale sur Firebase si demandé
        if (deleteMainImage && existingArtist.imageUrl) {
            try {
                const { deleteImageFromFirebase } = await import('@/lib/firebase/storage')
                await deleteImageFromFirebase(existingArtist.imageUrl)
            } catch (error) {
                console.error('Erreur lors de la suppression de l\'image principale sur Firebase:', error)
                // Continuer même en cas d'erreur de suppression Firebase
            }
        }

        // Mettre à jour l'artiste dans la table Artist
        const artist = await prisma.artist.update({
            where: { id: artistId },
            data: {
                pseudo: pseudo,
                description: description,
                imageUrl: finalImageUrl,
                birthYear: birthYear || null,
                countryCode: countryCode || null,
                websiteUrl: websiteUrl || null,
                facebookUrl: facebookUrl || null,
                instagramUrl: instagramUrl || null,
                twitterUrl: twitterUrl || null,
                linkedinUrl: linkedinUrl || null
            }
        })

        // Récupérer le LandingArtist associé
        const landingArtist = await prisma.landingArtist.findFirst({
            where: { artistId: artist.id }
        })

        if (landingArtist) {
            // Préparer les données de mise à jour
            const landingArtistData: any = {
                description: description,
                imageUrl: finalImageUrl,
                artistsPage: artistsPage,
                biographyHeader1: biographyHeader1 || null,
                biographyText1: biographyText1 || null,
                biographyHeader2: biographyHeader2 || null,
                biographyText2: biographyText2 || null,
                biographyHeader3: biographyHeader3 || null,
                biographyText3: biographyText3 || null,
                biographyHeader4: biographyHeader4 || null,
                biographyText4: biographyText4 || null
            }

            // Gérer les images secondaires et studio
            if (deleteSecondaryImage) {
                // Supprimer l'image sur Firebase si elle existe
                if (landingArtist.secondaryImageUrl) {
                    try {
                        const { deleteImageFromFirebase } = await import('@/lib/firebase/storage')
                        await deleteImageFromFirebase(landingArtist.secondaryImageUrl)
                    } catch (error) {
                        console.error('Erreur lors de la suppression de l\'image secondaire sur Firebase:', error)
                        // Continuer même en cas d'erreur de suppression Firebase
                    }
                }
                landingArtistData.secondaryImageUrl = null
            } else if (secondaryImageUrl) {
                landingArtistData.secondaryImageUrl = secondaryImageUrl
            }

            if (deleteStudioImage) {
                // Supprimer l'image sur Firebase si elle existe
                if (landingArtist.imageArtistStudio) {
                    try {
                        const { deleteImageFromFirebase } = await import('@/lib/firebase/storage')
                        await deleteImageFromFirebase(landingArtist.imageArtistStudio)
                    } catch (error) {
                        console.error('Erreur lors de la suppression de l\'image studio sur Firebase:', error)
                        // Continuer même en cas d'erreur de suppression Firebase
                    }
                }
                landingArtistData.imageArtistStudio = null
            } else if (imageArtistStudio) {
                landingArtistData.imageArtistStudio = imageArtistStudio
            }

            // Mettre à jour le LandingArtist
            await prisma.landingArtist.update({
                where: { id: landingArtist.id },
                data: landingArtistData
            })
        }

        // Supprimer l'image principale sur Firebase si demandé
        if (deleteMainImage && existingArtist.imageUrl) {
            try {
                const { deleteImageFromFirebase } = await import('@/lib/firebase/storage')
                await deleteImageFromFirebase(existingArtist.imageUrl)
            } catch (error) {
                console.error('Erreur lors de la suppression de l\'image principale sur Firebase:', error)
                // Continuer même en cas d'erreur de suppression Firebase
            }
        }

        // Revalider les chemins
        revalidatePath('/dataAdministration/artists')
        revalidatePath('/landing/landingArtists')
        revalidatePath('/dashboard')
        revalidatePath('/art/edit-artist-profile')

        return {
            success: true,
            artist
        }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour du profil artiste:', error)
        return {
            success: false,
            message: error.code === 'P2002'
                ? 'Un champ unique est déjà utilisé'
                : 'Une erreur est survenue lors de la mise à jour du profil artiste'
        }
    }
}

/**
 * Récupère tous les artistes et galeries
 */
export async function getAllArtistsAndGalleries() {
  try {
    const artists = await prisma.artist.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        pseudo: true,
        description: true,
        publicKey: true,
        imageUrl: true,
        isGallery: true,
        backgroundImage: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return artists
  } catch (error) {
    console.error('Erreur lors de la récupération des artistes:', error)
    return []
  }
} 