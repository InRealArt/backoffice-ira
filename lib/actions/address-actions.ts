'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { ArtistAddress } from '@prisma/client'

// Récupérer les adresses d'un utilisateur BackofficeAuthUser (schéma backoffice)
export async function getAddresses(backofficeAuthUserId: string) {
    try {
        const addresses = await prisma.artistAddress.findMany({
            where: {
                backofficeAuthUserId
            },
            orderBy: {
                name: 'asc'
            }
        })

        return {
            success: true,
            data: addresses
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des adresses:', error)
        return {
            success: false,
            error: 'Impossible de récupérer les adresses'
        }
    }
}

// Récupérer les adresses d'un artiste via BackofficeAuthUser (schéma backoffice) - pour les admins
export async function getAddressesByArtistId(artistId: number) {
    try {
        // Trouver le BackofficeAuthUser associé à l'artiste
        const backofficeAuthUser = await prisma.backofficeAuthUser.findFirst({
            where: {
                artistId
            },
            select: {
                id: true
            }
        })

        if (!backofficeAuthUser) {
            return {
                success: true,
                data: []
            }
        }

        // Récupérer les adresses via BackofficeAddress
        const addresses = await prisma.artistAddress.findMany({
            where: {
                backofficeAuthUserId: backofficeAuthUser.id
            },
            orderBy: {
                name: 'asc'
            }
        })

        return {
            success: true,
            data: addresses
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des adresses:', error)
        return {
            success: false,
            error: 'Impossible de récupérer les adresses'
        }
    }
}

// Récupérer toutes les adresses pour l'administration
export async function getAllAddressesForAdmin() {
    try {
        const addresses = await prisma.artistAddress.findMany({
            select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                streetAddress: true,
                postalCode: true,
                city: true,
                country: true,
                backofficeAuthUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        return addresses
    } catch (error) {
        console.error('Erreur lors de la récupération de toutes les adresses:', error)
        return []
    }
}

// Récupérer une adresse par son ID
export async function getAddressById(id: number) {
    try {
        const address = await prisma.artistAddress.findUnique({
            where: {
                id
            }
        })

        if (!address) {
            return {
                success: false,
                error: 'Adresse non trouvée'
            }
        }

        return {
            success: true,
            data: address
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'adresse:', error)
        return {
            success: false,
            error: 'Impossible de récupérer l\'adresse'
        }
    }
}

// Créer une nouvelle adresse
export async function createAddress(data: {
    firstName: string
    lastName: string
    streetAddress: string
    postalCode: string
    city: string
    country: string
    vatNumber?: string
    backofficeAuthUserId: string
}) {
    try {
        // Ajout des champs obligatoires manquants
        const enrichedData = {
            ...data,
            name: `${data.firstName} ${data.lastName}`, // Nom de l'adresse généré à partir du prénom et du nom
            countryCode: getCountryCode(data.country) // Obtenir le code pays à partir du nom du pays
        };

        const address = await prisma.artistAddress.create({
            data: enrichedData
        })

        revalidatePath('/art/addresses')

        return {
            success: true,
            data: address
        }
    } catch (error) {
        console.error('Erreur lors de la création de l\'adresse:', error)
        return {
            success: false,
            error: 'Impossible de créer l\'adresse'
        }
    }
}

// Mettre à jour une adresse
export async function updateAddress(id: number, data: {
    name?: string
    firstName: string
    lastName: string
    streetAddress: string
    postalCode: string
    city: string
    country: string
    countryCode?: string
    vatNumber?: string
}) {
    try {
        const address = await prisma.artistAddress.findUnique({
            where: { id }
        })

        if (!address) {
            return {
                success: false,
                error: 'Adresse non trouvée'
            }
        }

        // Ajout des champs obligatoires manquants pour la mise à jour
        const enrichedData = {
            ...data,
            name: data.name || `${data.firstName} ${data.lastName}`, // Nom de l'adresse généré à partir du prénom et du nom
            countryCode: data.countryCode || getCountryCode(data.country) // Obtenir le code pays à partir du nom du pays
        };

        const updatedAddress = await prisma.artistAddress.update({
            where: { id },
            data: enrichedData
        })

        revalidatePath('/art/addresses')
        revalidatePath(`/art/addresses/${id}/edit`)

        return {
            success: true,
            data: updatedAddress
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'adresse:', error)
        return {
            success: false,
            error: 'Impossible de mettre à jour l\'adresse'
        }
    }
}

// Supprimer une adresse
export async function deleteAddress(id: number) {
    try {
        const address = await prisma.artistAddress.findUnique({
            where: { id }
        })

        if (!address) {
            return {
                success: false,
                error: 'Adresse non trouvée'
            }
        }

        await prisma.artistAddress.delete({
            where: { id }
        })

        revalidatePath('/art/addresses')

        return {
            success: true
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'adresse:', error)
        return {
            success: false,
            error: 'Impossible de supprimer l\'adresse'
        }
    }
}

// Fonction utilitaire pour obtenir le code pays à partir du nom du pays
function getCountryCode(countryName: string): string {
    // Table de correspondance simple des pays les plus courants
    const countryCodes: Record<string, string> = {
        'France': 'FR',
        'Belgique': 'BE',
        'Suisse': 'CH',
        'Luxembourg': 'LU',
        'Allemagne': 'DE',
        'Italie': 'IT',
        'Espagne': 'ES',
        'Portugal': 'PT',
        'Royaume-Uni': 'GB',
        'États-Unis': 'US',
        'Canada': 'CA',
        // Ajoutez d'autres pays au besoin
    };

    // Retourner le code correspondant ou 'XX' par défaut
    return countryCodes[countryName] || 'XX';
} 