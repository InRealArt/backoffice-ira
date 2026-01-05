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

        // Gérer les récompenses (awards)
        const awardsData = formData.get('awards') as string | null
        if (awardsData) {
            try {
                const awards = JSON.parse(awardsData) as Array<{ name: string; description?: string; year?: number }>
                console.log('Récompenses reçues pour création:', awards)
                if (Array.isArray(awards) && awards.length > 0) {
                    const awardsToCreate = awards
                        .filter(award => award.name && award.name.trim() !== '')
                        .map((award) => ({
                            artistId: artist.id,
                            name: award.name.trim(),
                            description: award.description?.trim() || null,
                            year: award.year || null
                        }))
                    console.log('Récompenses à créer:', awardsToCreate)
                    if (awardsToCreate.length > 0) {
                        await prisma.artistAward.createMany({
                            data: awardsToCreate
                        })
                        console.log(`${awardsToCreate.length} récompense(s) créée(s) avec succès`)
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la création des récompenses:', error)
                // Ne pas bloquer la création du profil si les récompenses échouent
            }
        } else {
            console.log('Aucune donnée de récompenses reçue')
        }

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
 * Récupère les récompenses d'un artiste
 */
export async function getArtistAwards(artistId: number) {
    try {
        return await prisma.artistAward.findMany({
            where: { artistId },
            select: {
                id: true,
                name: true,
                description: true,
                year: true,
                artistId: true
            },
            orderBy: [
                { year: 'desc' }
            ]
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des récompenses:', error)
        return []
    }
}

/**
 * Récupère les spécialités d'un artiste
 */
export async function getArtistSpecialties(artistId: number) {
    try {
        const artistSpecialties = await prisma.artistSpecialtyArtist.findMany({
            where: { artistId },
            select: {
                artistSpecialtyId: true
            }
        })
        return artistSpecialties.map(asa => asa.artistSpecialtyId)
    } catch (error) {
        console.error('Erreur lors de la récupération des spécialités:', error)
        return []
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

        // Note: La suppression du fichier Firebase est gérée côté client avant d'appeler cette fonction
        // Voir EditArtistProfileForm.tsx -> onSubmit()

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
            // Note: La suppression des fichiers Firebase est gérée côté client avant d'appeler cette fonction
            // Voir EditArtistProfileForm.tsx -> onSubmit()
            if (deleteSecondaryImage) {
                landingArtistData.secondaryImageUrl = null
            } else if (secondaryImageUrl) {
                landingArtistData.secondaryImageUrl = secondaryImageUrl
            }

            if (deleteStudioImage) {
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

        // Gérer les récompenses (awards) - remplacer toutes les récompenses existantes
        const awardsData = formData.get('awards') as string | null
        if (awardsData !== null) {
            try {
                // Supprimer toutes les récompenses existantes
                await prisma.artistAward.deleteMany({
                    where: { artistId: artist.id }
                })

                // Créer les nouvelles récompenses
                const awards = JSON.parse(awardsData) as Array<{ name: string; description?: string; year?: number }>
                console.log('Récompenses reçues pour mise à jour:', awards)
                if (Array.isArray(awards) && awards.length > 0) {
                    const awardsToCreate = awards
                        .filter(award => award.name && award.name.trim() !== '')
                        .map((award) => ({
                            artistId: artist.id,
                            name: award.name.trim(),
                            description: award.description?.trim() || null,
                            year: award.year || null
                        }))
                    console.log('Récompenses à créer:', awardsToCreate)
                    if (awardsToCreate.length > 0) {
                        await prisma.artistAward.createMany({
                            data: awardsToCreate
                        })
                        console.log(`${awardsToCreate.length} récompense(s) mise(s) à jour avec succès`)
                    }
                } else {
                    console.log('Aucune récompense à créer (liste vide)')
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour des récompenses:', error)
                // Ne pas bloquer la mise à jour du profil si les récompenses échouent
            }
        } else {
            console.log('Aucune donnée de récompenses reçue pour la mise à jour')
        }

        // Gérer les spécialités de l'artiste
        const specialtyIdsData = formData.get('specialtyIds') as string | null
        if (specialtyIdsData !== null) {
            try {
                const specialtyIds = JSON.parse(specialtyIdsData) as number[]
                console.log('Spécialités reçues pour mise à jour:', specialtyIds)

                // Supprimer toutes les spécialités existantes
                await prisma.artistSpecialtyArtist.deleteMany({
                    where: { artistId: artist.id }
                })

                // Créer les nouvelles relations de spécialités
                if (specialtyIds.length > 0) {
                    await prisma.artistSpecialtyArtist.createMany({
                        data: specialtyIds.map(specialtyId => ({
                            artistId: artist.id,
                            artistSpecialtyId: specialtyId
                        }))
                    })
                    console.log(`${specialtyIds.length} spécialité(s) mise(s) à jour avec succès`)
                } else {
                    console.log('Aucune spécialité à créer (liste vide)')
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour des spécialités:', error)
                // Ne pas bloquer la mise à jour du profil si les spécialités échouent
            }
        } else {
            console.log('Aucune donnée de spécialités reçue pour la mise à jour')
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
                backgroundImage: true,
                BackofficeUser: {
                    select: {
                        id: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        // Mapper les artistes pour correspondre au type FilterArtist
        return artists.map(artist => {
            const { BackofficeUser, ...artistWithoutBackofficeUser } = artist
            return {
                ...artistWithoutBackofficeUser,
                idUser: BackofficeUser.length > 0 ? String(BackofficeUser[0].id) : null
            }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des artistes:', error)
        return []
    }
}

/**
 * Duplique un artiste en ajoutant "TEST" au nom de famille
 */
export async function duplicateArtist(artistId: number): Promise<{ success: boolean; message?: string; artist?: Artist }> {
    try {
        // Récupérer l'artiste original avec son LandingArtist et ses relations
        const originalArtist = await prisma.artist.findUnique({
            where: { id: artistId },
            include: {
                artistSpecialties: {
                    include: {
                        artistSpecialty: true
                    }
                }
            }
        })

        if (!originalArtist) {
            return {
                success: false,
                message: 'Artiste non trouvé'
            }
        }

        // Récupérer le LandingArtist original s'il existe
        const originalLandingArtist = await prisma.landingArtist.findFirst({
            where: { artistId },
            include: {
                artistCategories: true
            }
        })

        // Préparer les données dupliquées
        const newSurname = `${originalArtist.surname} TEST`
        const newDescription = `${originalArtist.description} (TEST)`
        const newSlug = generateSlug(`${originalArtist.name} ${newSurname}`)

        // Générer un pseudo unique sans timestamp
        let newPseudo = `${originalArtist.pseudo}-test`
        let counter = 1
        while (await prisma.artist.findFirst({ where: { pseudo: newPseudo } })) {
            newPseudo = `${originalArtist.pseudo}-test-${counter}`
            counter++
        }

        // Générer une clé publique unique sans timestamp
        let newPublicKey = `${originalArtist.publicKey}-test`
        counter = 1
        while (await prisma.artist.findFirst({ where: { publicKey: newPublicKey } })) {
            newPublicKey = `${originalArtist.publicKey}-test-${counter}`
            counter++
        }

        // Utiliser la même imageUrl avec un paramètre de requête pour respecter l'unicité
        // Le paramètre de requête ne change pas l'image réelle mais rend l'URL unique
        let newImageUrl = originalArtist.imageUrl || ''
        if (newImageUrl) {
            // Ajouter un paramètre de requête pour rendre l'URL unique sans changer l'image
            const separator = newImageUrl.includes('?') ? '&' : '?'
            newImageUrl = `${newImageUrl}${separator}duplicate=${Date.now()}`
        }

        // S'assurer que le pays existe dans la base de données
        if (originalArtist.countryCode) {
            await ensureCountryExists(originalArtist.countryCode)
        }

        // Créer l'artiste dupliqué
        const duplicatedArtist = await prisma.artist.create({
            data: {
                name: originalArtist.name,
                surname: newSurname,
                pseudo: newPseudo,
                description: newDescription,
                publicKey: newPublicKey,
                imageUrl: newImageUrl,
                isGallery: originalArtist.isGallery,
                backgroundImage: originalArtist.backgroundImage,
                slug: newSlug,
                featuredArtwork: originalArtist.featuredArtwork,
                birthYear: originalArtist.birthYear,
                countryCode: originalArtist.countryCode,
                websiteUrl: originalArtist.websiteUrl,
                facebookUrl: originalArtist.facebookUrl,
                instagramUrl: originalArtist.instagramUrl,
                twitterUrl: originalArtist.twitterUrl,
                linkedinUrl: originalArtist.linkedinUrl,
            }
        })

        // Dupliquer les spécialités de l'artiste
        if (originalArtist.artistSpecialties && originalArtist.artistSpecialties.length > 0) {
            await prisma.artistSpecialtyArtist.createMany({
                data: originalArtist.artistSpecialties.map(specialty => ({
                    artistId: duplicatedArtist.id,
                    artistSpecialtyId: specialty.artistSpecialtyId
                }))
            })
        }

        // Créer le LandingArtist dupliqué s'il existe un LandingArtist original
        if (originalLandingArtist) {
            // Générer un slug unique pour le LandingArtist
            let newLandingSlug = newSlug
            counter = 1
            while (await prisma.landingArtist.findFirst({ where: { slug: newLandingSlug } })) {
                newLandingSlug = `${newSlug}-${counter}`
                counter++
            }

            // Générer une imageUrl unique pour le LandingArtist
            let newLandingImageUrl = originalLandingArtist.imageUrl
            if (newLandingImageUrl) {
                const separator = newLandingImageUrl.includes('?') ? '&' : '?'
                newLandingImageUrl = `${newLandingImageUrl}${separator}duplicate=${Date.now()}`
            }

            // Générer une secondaryImageUrl unique si elle existe
            let newSecondaryImageUrl = originalLandingArtist.secondaryImageUrl
            if (newSecondaryImageUrl) {
                const separator = newSecondaryImageUrl.includes('?') ? '&' : '?'
                newSecondaryImageUrl = `${newSecondaryImageUrl}${separator}duplicate=${Date.now()}`
            }

            // Générer une imageArtistStudio unique si elle existe
            let newImageArtistStudio = originalLandingArtist.imageArtistStudio
            if (newImageArtistStudio) {
                const separator = newImageArtistStudio.includes('?') ? '&' : '?'
                newImageArtistStudio = `${newImageArtistStudio}${separator}duplicate=${Date.now()}`
            }

            // Créer le LandingArtist dupliqué
            const duplicatedLandingArtist = await prisma.landingArtist.create({
                data: {
                    artistId: duplicatedArtist.id,
                    slug: newLandingSlug,
                    intro: originalLandingArtist.intro,
                    description: originalLandingArtist.description,
                    artworkImages: originalLandingArtist.artworkImages || '[]',
                    artworkStyle: originalLandingArtist.artworkStyle,
                    artistsPage: false, // Toujours à false lors de la duplication
                    imageUrl: newLandingImageUrl,
                    secondaryImageUrl: newSecondaryImageUrl,
                    mediumTags: originalLandingArtist.mediumTags || [],
                    quoteFromInRealArt: originalLandingArtist.quoteFromInRealArt,
                    biographyHeader1: originalLandingArtist.biographyHeader1,
                    biographyText1: originalLandingArtist.biographyText1,
                    biographyHeader2: originalLandingArtist.biographyHeader2,
                    biographyText2: originalLandingArtist.biographyText2,
                    biographyHeader3: originalLandingArtist.biographyHeader3,
                    biographyText3: originalLandingArtist.biographyText3,
                    biographyHeader4: originalLandingArtist.biographyHeader4,
                    biographyText4: originalLandingArtist.biographyText4,
                    imageArtistStudio: newImageArtistStudio,
                }
            })

            // Dupliquer les catégories d'artiste si elles existent
            if (originalLandingArtist.artistCategories && originalLandingArtist.artistCategories.length > 0) {
                await prisma.artistCategoryArtist.createMany({
                    data: originalLandingArtist.artistCategories.map(category => ({
                        landingArtistId: duplicatedLandingArtist.id,
                        categoryId: category.categoryId
                    }))
                })
            }
        }

        revalidatePath('/dataAdministration/artists')
        revalidatePath('/landing/landingArtists')

        return {
            success: true,
            artist: duplicatedArtist
        }
    } catch (error: any) {
        console.error('Erreur lors de la duplication de l\'artiste:', error)

        if (error.code === 'P2002') {
            return {
                success: false,
                message: 'Un champ unique est déjà utilisé. Veuillez réessayer.'
            }
        }

        return {
            success: false,
            message: error.message || 'Une erreur est survenue lors de la duplication de l\'artiste'
        }
    }
}

/**
 * Récupère tous les artistes avec le nombre de presaleArtwork correspondants et la date d'onboarding
 * @param nameFilter - Filtre optionnel pour rechercher par nom ou prénom
 */
export async function getArtistsWithPresaleArtworkCount(nameFilter?: string) {
    try {
        // Construire la condition de filtrage
        const where: any = {
            isGallery: false
        }

        // Ajouter le filtre par nom/prénom si fourni
        if (nameFilter && nameFilter.trim()) {
            where.OR = [
                { name: { contains: nameFilter.trim(), mode: 'insensitive' as const } },
                { surname: { contains: nameFilter.trim(), mode: 'insensitive' as const } }
            ]
        }

        // Récupérer tous les artistes
        const artists = await prisma.artist.findMany({
            where,
            select: {
                id: true,
                name: true,
                surname: true,
                pseudo: true,
                imageUrl: true,
                LandingArtist: {
                    select: {
                        id: true,
                        onboardingBo: true
                    },
                    take: 1
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        // Récupérer les counts de PresaleArtworks pour tous les artistes en une seule requête
        const artistIds = artists.map(a => a.id)
        const presaleCounts = await prisma.presaleArtwork.groupBy({
            by: ['artistId'],
            where: {
                artistId: {
                    in: artistIds
                }
            },
            _count: {
                id: true
            }
        })

        // Créer une map pour un accès rapide
        const countMap = new Map<number, number>()
        presaleCounts.forEach(item => {
            countMap.set(item.artistId, item._count.id)
        })

        // Mapper les résultats
        return artists.map(artist => {
            const landingArtist = Array.isArray(artist.LandingArtist)
                ? artist.LandingArtist[0]
                : null

            return {
                id: artist.id,
                name: artist.name,
                surname: artist.surname,
                pseudo: artist.pseudo,
                imageUrl: artist.imageUrl,
                presaleArtworkCount: countMap.get(artist.id) || 0,
                landingArtistId: landingArtist?.id || null,
                onboardingBo: landingArtist?.onboardingBo || null
            }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des artistes avec le nombre de presaleArtwork:', error)
        return []
    }
}
