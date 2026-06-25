import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-helpers'

/**
 * Route handler pour l'import Excel de presale artworks
 * Accepte multipart/form-data avec le fichier Excel
 * Nécessite une authentification + rôle admin ou propriétaire de l'artiste
 */
export async function POST(request: NextRequest) {
    try {
        // Vérifier l'authentification
        const session = await getSession()
        if (!session?.user) {
            return NextResponse.json(
                { success: false, message: 'Non authentifié' },
                { status: 401 }
            )
        }

        // Vérifier le rôle admin
        const isAdmin = session.user.role === 'admin'
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, message: 'Accès non autorisé' },
                { status: 403 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const artistIdStr = formData.get('artistId') as string

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'Aucun fichier fourni' },
                { status: 400 }
            )
        }

        if (!artistIdStr) {
            return NextResponse.json(
                { success: false, message: 'Aucun artiste sélectionné' },
                { status: 400 }
            )
        }

        const artistId = parseInt(artistIdStr, 10)
        if (isNaN(artistId)) {
            return NextResponse.json(
                { success: false, message: 'ID artiste invalide' },
                { status: 400 }
            )
        }

        // Vérifier que l'artiste existe
        const artist = await prisma.artist.findUnique({
            where: { idUser: artistId }
        })

        if (!artist) {
            return NextResponse.json(
                { success: false, message: 'Artiste non trouvé' },
                { status: 404 }
            )
        }

        // Convertir le fichier en ArrayBuffer
        const buffer = await file.arrayBuffer()

        // Importer ExcelJS dynamiquement
        const ExcelJS = (await import('exceljs')).default

        // Créer un workbook et charger le fichier
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer)

        const worksheet = workbook.worksheets[0]
        if (!worksheet) {
            return NextResponse.json(
                { success: false, message: 'Le fichier Excel ne contient aucune feuille' },
                { status: 400 }
            )
        }

        // Lire les en-têtes
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

        if (nameIndex === -1 || imageUrlIndex === -1) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Le fichier Excel doit contenir au minimum les colonnes "Nom oeuvre" et "url oeuvre"'
                },
                { status: 400 }
            )
        }

        // Lire les données
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

            const name = row.getCell(nameIndex + 1).value?.toString().trim()
            const imageUrl = row.getCell(imageUrlIndex + 1).value?.toString().trim()

            if (!name || !imageUrl) {
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
            return NextResponse.json(
                {
                    success: false,
                    message: 'Aucune donnée valide trouvée dans le fichier Excel'
                },
                { status: 400 }
            )
        }

        // Créer les artwork en masse
        const maxOrder = await prisma.presaleArtwork.aggregate({
            _max: { order: true }
        })

        const orderStart = (maxOrder._max.order || 0) + 1

        await prisma.presaleArtwork.createMany({
            data: artworks.map((artwork, index) => ({
                artistId,
                name: artwork.name,
                description: artwork.description || null,
                price: artwork.price || null,
                imageUrl: artwork.imageUrl,
                width: artwork.width,
                height: artwork.height,
                order: orderStart + index,
                isSold: false,
                isTopArtwork: false,
                isFeatured: false,
                mockupUrls: '[]'
            }))
        })

        // Récupérer les artworks créés
        const createdArtworks = await prisma.presaleArtwork.findMany({
            where: {
                artistId,
                order: {
                    gte: orderStart,
                    lte: orderStart + artworks.length - 1
                }
            },
            include: { artist: true },
            orderBy: { order: 'asc' }
        })

        revalidatePath('/landing/presaleArtworks')

        return NextResponse.json({
            success: true,
            artworks: createdArtworks,
            count: createdArtworks.length
        })
    } catch (error) {
        console.error('Erreur lors de l\'import Excel:', error)
        return NextResponse.json(
            {
                success: false,
                message: (error as Error).message || 'Une erreur est survenue lors de l\'import'
            },
            { status: 500 }
        )
    }
}
