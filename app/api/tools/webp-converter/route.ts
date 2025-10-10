import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

// Configuration Vercel pour éviter les timeouts
export const runtime = 'nodejs'
export const maxDuration = 30 // Augmenter à 30 secondes pour les conversions

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const files = formData.getAll('images') as File[]

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: 'Aucune image fournie' },
                { status: 400 }
            )
        }

        if (files.length > 5) {
            return NextResponse.json(
                { error: 'Maximum 5 images autorisées' },
                { status: 400 }
            )
        }

        const convertedImages = []

        // Traiter les images en parallèle pour aller plus vite
        const conversionPromises = files.map(async (file) => {
            try {
                // Vérifier le type de fichier
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff']
                if (!validTypes.includes(file.type)) {
                    throw new Error(`Type de fichier non supporté: ${file.type}`)
                }

                // Vérifier la taille du fichier (limite à 10MB pour éviter les timeouts)
                const maxSize = 10 * 1024 * 1024 // 10MB
                if (file.size > maxSize) {
                    throw new Error(`Fichier trop volumineux: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB). Maximum: 10MB`)
                }

                // Convertir le fichier en buffer
                const arrayBuffer = await file.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)

                // Générer un nom de fichier basé sur le nom original
                const originalName = file.name
                const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '') // Supprimer l'extension
                const outputFileName = `${nameWithoutExt}.webp`

                // Convertir en WebP avec Sharp (optimisé pour Vercel)
                const webpBuffer = await sharp(buffer)
                    .resize(1920, 1920, {
                        fit: 'inside',
                        withoutEnlargement: true
                    }) // Réduire la taille si nécessaire
                    .webp({
                        quality: 80, // Réduire la qualité pour aller plus vite
                        effort: 4, // Réduire l'effort (0-6, 4 est un bon compromis)
                        smartSubsample: true,
                        lossless: false
                    })
                    .timeout({ seconds: 10 }) // Timeout de 10 secondes par image
                    .toBuffer()

                const originalSize = buffer.length
                const convertedSize = webpBuffer.length
                const compressionRatio = ((originalSize - convertedSize) / originalSize) * 100

                // Convertir le buffer en base64 pour l'envoi
                const base64Data = webpBuffer.toString('base64')
                const dataUrl = `data:image/webp;base64,${base64Data}`

                return {
                    id: uuidv4(),
                    originalName,
                    outputFileName,
                    originalSize,
                    convertedSize,
                    downloadUrl: dataUrl, // Utiliser data URL au lieu d'un fichier
                    compressionRatio: Math.max(0, compressionRatio), // Éviter les valeurs négatives
                    base64Data // Garder les données pour le téléchargement
                }

            } catch (error) {
                console.error(`Erreur lors de la conversion de ${file.name}:`, error)
                return null // Retourner null pour les erreurs
            }
        })

        // Attendre toutes les conversions en parallèle
        const results = await Promise.all(conversionPromises)

        // Filtrer les résultats valides
        const validResults = results.filter(result => result !== null)
        convertedImages.push(...validResults)

        if (convertedImages.length === 0) {
            return NextResponse.json(
                { error: 'Aucune image n\'a pu être convertie' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            convertedImages,
            message: `${convertedImages.length} image(s) convertie(s) avec succès`
        })

    } catch (error) {
        console.error('Erreur dans l\'API de conversion WebP:', error)
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        )
    }
}
