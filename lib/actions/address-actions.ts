'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { Address } from '@prisma/client'

// Récupérer les adresses d'un utilisateur
export async function getAddresses(backofficeUserId: number) {
    try {
        const addresses = await prisma.address.findMany({
            where: {
                backofficeUserId
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

// Récupérer une adresse par son ID
export async function getAddressById(id: number) {
    try {
        const address = await prisma.address.findUnique({
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
    backofficeUserId: number
}) {
    try {
        // Ajout des champs obligatoires manquants
        const enrichedData = {
            ...data,
            name: `${data.firstName} ${data.lastName}`, // Nom de l'adresse généré à partir du prénom et du nom
            countryCode: getCountryCode(data.country) // Obtenir le code pays à partir du nom du pays
        };

        const address = await prisma.address.create({
            data: enrichedData
        })

        revalidatePath('/shopify/addresses')

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
    firstName: string
    lastName: string
    streetAddress: string
    postalCode: string
    city: string
    country: string
    vatNumber?: string
}) {
    try {
        const address = await prisma.address.findUnique({
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
            name: `${data.firstName} ${data.lastName}`, // Nom de l'adresse généré à partir du prénom et du nom
            countryCode: getCountryCode(data.country) // Obtenir le code pays à partir du nom du pays
        };

        const updatedAddress = await prisma.address.update({
            where: { id },
            data: enrichedData
        })

        revalidatePath('/shopify/addresses')
        revalidatePath(`/shopify/addresses/${id}/edit`)

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
        const address = await prisma.address.findUnique({
            where: { id }
        })

        if (!address) {
            return {
                success: false,
                error: 'Adresse non trouvée'
            }
        }

        await prisma.address.delete({
            where: { id }
        })

        revalidatePath('/shopify/addresses')

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