'use server'

import { prisma } from '@/lib/prisma'
import { Artist, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { generateSlug, toCamelCase } from '@/lib/utils'

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

export async function updateArtist(
    id: number,
    data: Prisma.ArtistUpdateInput
): Promise<{ success: boolean; message?: string }> {
    try {
        // Filtrer les champs autorisés pour éviter les erreurs Prisma
        // Note: countryCode temporairement retiré car le client Prisma n'est pas synchronisé
        const allowedData: Prisma.ArtistUpdateInput = {
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
            // countryCode: data.countryCode, // TODO: Réactiver après npx prisma generate
            websiteUrl: data.websiteUrl,
            facebookUrl: data.facebookUrl,
            instagramUrl: data.instagramUrl,
            twitterUrl: data.twitterUrl,
            linkedinUrl: data.linkedinUrl,
        }

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

        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour.'
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
        return {
            success: false,
            message: error.code === 'P2002'
                ? 'Un champ unique est déjà utilisé'
                : 'Une erreur est survenue lors de la création de l\'artiste'
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
                artworkImages: '[]'
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