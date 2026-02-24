'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { PresaleArtwork } from '@/src/generated/prisma/client'

/**
 * Récupère toutes les œuvres en prévente
 */
export async function getAllPresaleArtworks() {
    try {
        const presaleArtworks = await prisma.presaleArtwork.findMany({
            include: {
                artist: true
            },
            orderBy: {
                name: 'asc'
            }
        })

        return presaleArtworks
    } catch (error) {
        console.error('Erreur lors de la récupération des œuvres en prévente:', error)
        return []
    }
}

/**
 * Récupère une œuvre en prévente par son ID
 */
export async function getPresaleArtworkById(id: number) {
    try {
        const presaleArtwork = await prisma.presaleArtwork.findUnique({
            where: { id },
            include: {
                artist: true
            }
        })

        return presaleArtwork
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'œuvre en prévente:', error)
        return null
    }
}

/**
 * Récupère l'ordre maximum des œuvres en prévente
 */
export async function getMaxPresaleArtworkOrder() {
    try {
        const result = await prisma.presaleArtwork.aggregate({
            _max: {
                order: true
            }
        })

        // Retourne le max ou 0 si aucun résultat
        return result._max.order || 0
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'ordre maximum:', error)
        return 0
    }
}

/**
 * Compte le nombre d'œuvres en prévente pour un artiste
 */
export async function getPresaleArtworkCountByArtist(artistId: number) {
    try {
        const count = await prisma.presaleArtwork.count({
            where: {
                artistId
            }
        })

        return { count, success: true }
    } catch (error) {
        console.error('Erreur lors du comptage des œuvres en prévente:', error)
        return { count: 0, success: false }
    }
}

/**
 * Récupère une œuvre en prévente par son ordre
 */
export async function getPresaleArtworkByOrder(order: number) {
    try {
        return await prisma.presaleArtwork.findFirst({
            where: { order }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'œuvre par ordre:', error)
        return null
    }
}

/**
 * Échange l'ordre entre deux œuvres en prévente
 */
export async function swapPresaleArtworkOrder(id1: number, order1: number, id2: number, order2: number) {
    try {
        // Utiliser une transaction pour garantir l'atomicité
        await prisma.$transaction([
            prisma.presaleArtwork.update({
                where: { id: id1 },
                data: { order: order2 }
            }),
            prisma.presaleArtwork.update({
                where: { id: id2 },
                data: { order: order1 }
            })
        ])

        revalidatePath('/landing/presaleArtworks')
        return true
    } catch (error) {
        console.error('Erreur lors de l\'échange des ordres:', error)
        return false
    }
}

/**
 * Crée une nouvelle œuvre en prévente
 */
export async function createPresaleArtwork(data: {
    name: string
    artistId: number
    price: number | undefined | null
    imageUrl: string
    description?: string
    width?: number | null
    height?: number | null
    order?: number
    mockupUrls?: string
    isSold?: boolean
}) {
    try {
        // Si aucun ordre n'est fourni, utiliser l'ordre maximum + 1
        let orderToUse = data.order

        if (!orderToUse) {
            const maxOrder = await getMaxPresaleArtworkOrder()
            orderToUse = maxOrder + 1
        }

        const presaleArtwork = await prisma.presaleArtwork.create({
            data: {
                name: data.name,
                artistId: data.artistId,
                price: data.price,
                imageUrl: data.imageUrl,
                description: data.description,
                width: data.width,
                height: data.height,
                order: orderToUse,
                mockupUrls: data.mockupUrls || "[]",
                isSold: data.isSold ?? false
            },
            include: {
                artist: true
            }
        })

        revalidatePath('/landing/presaleArtworks')
        return {
            success: true,
            presaleArtwork
        }
    } catch (error) {
        console.error('Erreur lors de la création de l\'œuvre en prévente:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Met à jour une œuvre en prévente existante
 */
export async function updatePresaleArtwork(id: number, data: {
    name?: string
    artistId?: number
    price?: number | null
    imageUrl?: string
    description?: string
    width?: number | null
    height?: number | null
    order?: number
    mockupUrls?: string
    isSold?: boolean
}) {
    try {
        // Gérer l'échange d'ordre si nécessaire
        if (data.order !== undefined) {
            const currentArtwork = await getPresaleArtworkById(id)

            if (currentArtwork && currentArtwork.order !== data.order) {
                // Vérifier s'il existe une œuvre avec l'ordre cible
                const targetArtwork = await getPresaleArtworkByOrder(data.order)

                if (targetArtwork) {
                    // Échanger les ordres
                    await swapPresaleArtworkOrder(
                        id,
                        currentArtwork.order || 0,
                        targetArtwork.id,
                        targetArtwork.order || 0
                    )

                    // Supprimer l'ordre des données à mettre à jour car il a déjà été modifié
                    delete data.order
                }
            }
        }

        // Mettre à jour les autres données
        const presaleArtwork = await prisma.presaleArtwork.update({
            where: { id },
            data,
            include: {
                artist: true
            }
        })

        revalidatePath('/landing/presaleArtworks')
        revalidatePath(`/landing/presaleArtworks/${id}/edit`)

        return {
            success: true,
            presaleArtwork
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'œuvre en prévente:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Supprime une œuvre en prévente
 */
export async function deletePresaleArtwork(id: number) {
    try {
        // Récupérer l'œuvre avec l'artiste pour connaître son ordre et les infos de l'artiste
        const artwork = await prisma.presaleArtwork.findUnique({
            where: { id },
            include: {
                artist: true
            }
        })

        if (!artwork) {
            return {
                success: false,
                message: 'Œuvre en prévente introuvable'
            }
        }

        // Stocker l'ordre pour utilisation ultérieure
        const deletedOrder = artwork.order

        // Supprimer les traductions associées avant de supprimer l'œuvre
        await prisma.translation.deleteMany({
            where: {
                entityType: 'PresaleArtwork',
                entityId: id
            }
        })

        // Note: La suppression du fichier Firebase est gérée côté client avant d'appeler cette fonction
        // Voir PresaleArtworksClient.tsx -> handleDelete()

        // Supprimer l'œuvre
        await prisma.presaleArtwork.delete({
            where: { id }
        })

        // Si l'œuvre avait un ordre défini, mettre à jour les ordres des autres œuvres
        if (deletedOrder !== null) {
            // Décrémenter l'ordre de toutes les œuvres dont l'ordre est supérieur à celui de l'œuvre supprimée
            await prisma.presaleArtwork.updateMany({
                where: {
                    order: {
                        gt: deletedOrder
                    }
                },
                data: {
                    // Décrémenter l'ordre de 1
                    order: {
                        decrement: 1
                    }
                }
            })
        }

        revalidatePath('/landing/presaleArtworks')
        revalidatePath('/art/presale-artworks')

        return {
            success: true,
            message: 'Œuvre en prévente supprimée avec succès'
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'œuvre en prévente:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Crée plusieurs œuvres en prévente en une seule fois
 */
export async function createBulkPresaleArtworks(data: {
    artistId: number
    artworks: Array<{
        name: string
        description?: string
        price?: number | null
        imageUrl: string
        width?: number | null
        height?: number | null
    }>
}) {
    try {
        // Récupérer l'ordre maximum actuel
        const maxOrder = await getMaxPresaleArtworkOrder()

        // Préparer les données pour createMany (plus efficace que des create individuels)
        const artworksData = data.artworks.map((artworkData, i) => ({
            name: artworkData.name,
            artistId: data.artistId,
            price: artworkData.price,
            imageUrl: artworkData.imageUrl,
            description: artworkData.description,
            width: artworkData.width,
            height: artworkData.height,
            order: maxOrder + 1 + i,
            mockupUrls: "[]"
        }))

        // Utiliser createMany pour une insertion en lot (beaucoup plus rapide)
        await prisma.presaleArtwork.createMany({
            data: artworksData
        })

        // Récupérer les œuvres créées avec les relations
        const createdArtworks = await prisma.presaleArtwork.findMany({
            where: {
                artistId: data.artistId,
                order: {
                    gte: maxOrder + 1,
                    lte: maxOrder + data.artworks.length
                }
            },
            include: {
                artist: true
            },
            orderBy: {
                order: 'asc'
            }
        })

        revalidatePath('/landing/presaleArtworks')

        return {
            success: true,
            artworks: createdArtworks,
            count: createdArtworks.length
        }
    } catch (error) {
        console.error('Erreur lors de la création en masse des œuvres en prévente:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Traite un fichier Excel et crée les œuvres en prévente
 */
export async function processExcelImport(data: {
    artistId: number
    fileBase64: string
}) {
    try {
        console.log('🔵 [SERVER] Début du traitement Excel')
        console.log('👤 [SERVER] Artist ID:', data.artistId)
        console.log('📦 [SERVER] Base64 reçu, longueur:', data.fileBase64.length)
        console.log('📦 [SERVER] Premiers caractères:', data.fileBase64.substring(0, 50))

        // Importation dynamique d'exceljs
        console.log('📚 [SERVER] Import d\'ExcelJS...')
        const ExcelJS = (await import('exceljs')).default
        console.log('✅ [SERVER] ExcelJS importé')

        // Décoder le fichier base64 en ArrayBuffer
        console.log('🔓 [SERVER] Décodage base64...')
        const buffer = Buffer.from(data.fileBase64, 'base64')
        console.log('✅ [SERVER] Buffer créé, taille:', buffer.length)

        const arrayBuffer = buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength
        )
        console.log('✅ [SERVER] ArrayBuffer créé, taille:', arrayBuffer.byteLength)

        // Créer un workbook et charger le ArrayBuffer
        console.log('📖 [SERVER] Chargement du workbook...')
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(arrayBuffer)
        console.log('✅ [SERVER] Workbook chargé, nombre de feuilles:', workbook.worksheets.length)

        // Récupérer la première feuille
        const worksheet = workbook.worksheets[0]
        console.log('📄 [SERVER] Première feuille récupérée:', worksheet?.name)

        if (!worksheet) {
            return {
                success: false,
                message: 'Le fichier Excel ne contient aucune feuille'
            }
        }

        // Lire les en-têtes (première ligne)
        const headerRow = worksheet.getRow(1)
        const headers: string[] = []
        headerRow.eachCell({ includeEmpty: true }, (cell) => {
            headers.push(cell.value?.toString().toLowerCase().trim() || '')
        })

        // Trouver les indices des colonnes
        const nameIndex = headers.findIndex(h => h.includes('nom'))
        const descriptionIndex = headers.findIndex(h => h.includes('description'))
        const heightIndex = headers.findIndex(h => h.includes('hauteur'))
        const widthIndex = headers.findIndex(h => h.includes('largeur'))
        const priceIndex = headers.findIndex(h => h.includes('prix'))
        const imageUrlIndex = headers.findIndex(h => h.includes('url'))

        // Vérifier que toutes les colonnes requises sont présentes
        if (nameIndex === -1 || imageUrlIndex === -1) {
            return {
                success: false,
                message: 'Le fichier Excel doit contenir au minimum les colonnes "Nom oeuvre" et "url oeuvre"'
            }
        }

        // Lire les données (à partir de la ligne 2)
        const artworks: Array<{
            name: string
            description?: string
            price?: number | null
            imageUrl: string
            width?: number | null
            height?: number | null
        }> = []

        for (let i = 2; i <= worksheet.rowCount; i++) {
            const row = worksheet.getRow(i)

            // Vérifier si la ligne contient des données
            const name = row.getCell(nameIndex + 1).value?.toString().trim()
            const imageUrl = row.getCell(imageUrlIndex + 1).value?.toString().trim()

            if (!name || !imageUrl) {
                // Ligne vide ou incomplète, on passe
                continue
            }

            const description = descriptionIndex !== -1
                ? row.getCell(descriptionIndex + 1).value?.toString().trim()
                : undefined

            const height = heightIndex !== -1
                ? parseFloat(row.getCell(heightIndex + 1).value?.toString() || '') || null
                : null

            const width = widthIndex !== -1
                ? parseFloat(row.getCell(widthIndex + 1).value?.toString() || '') || null
                : null

            const price = priceIndex !== -1
                ? parseFloat(row.getCell(priceIndex + 1).value?.toString() || '') || null
                : null

            artworks.push({
                name,
                description,
                price,
                imageUrl,
                width: width ? Math.round(width) : null,
                height: height ? Math.round(height) : null
            })
        }

        if (artworks.length === 0) {
            return {
                success: false,
                message: 'Aucune œuvre valide trouvée dans le fichier Excel'
            }
        }

        // Utiliser la fonction existante pour créer les œuvres en masse
        const result = await createBulkPresaleArtworks({
            artistId: data.artistId,
            artworks
        })

        return result
    } catch (error) {
        console.error('❌ [SERVER] Erreur lors du traitement du fichier Excel:', error)
        console.error('❌ [SERVER] Type d\'erreur:', typeof error)
        console.error('❌ [SERVER] Message:', (error as Error).message)
        console.error('❌ [SERVER] Stack:', (error as Error).stack)
        return {
            success: false,
            message: `Erreur serveur: ${(error as Error).message}`
        }
    }
} 