import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

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

        for (const file of files) {
            try {
                // Vérifier le type de fichier
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff']
                if (!validTypes.includes(file.type)) {
                    throw new Error(`Type de fichier non supporté: ${file.type}`)
                }

                // Convertir le fichier en buffer
                const arrayBuffer = await file.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)

                // Générer un nom de fichier basé sur le nom original
                const originalName = file.name
                const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '') // Supprimer l'extension
                const outputFileName = `${nameWithoutExt}.webp`

                // Convertir en WebP avec Sharp
                const webpBuffer = await sharp(buffer)
                    .webp({
                        quality: 90, // Qualité élevée pour éviter la perte
                        effort: 6, // Effort maximum pour la compression
                        smartSubsample: true, // Optimisation intelligente
                        lossless: false // Compression avec perte contrôlée
                    })
                    .toBuffer()

                const originalSize = buffer.length
                const convertedSize = webpBuffer.length
                const compressionRatio = ((originalSize - convertedSize) / originalSize) * 100

                // Convertir le buffer en base64 pour l'envoi
                const base64Data = webpBuffer.toString('base64')
                const dataUrl = `data:image/webp;base64,${base64Data}`

                convertedImages.push({
                    id: uuidv4(),
                    originalName,
                    outputFileName,
                    originalSize,
                    convertedSize,
                    downloadUrl: dataUrl, // Utiliser data URL au lieu d'un fichier
                    compressionRatio: Math.max(0, compressionRatio), // Éviter les valeurs négatives
                    base64Data // Garder les données pour le téléchargement
                })

            } catch (error) {
                console.error(`Erreur lors de la conversion de ${file.name}:`, error)
                // Continuer avec les autres fichiers même si un échoue
                continue
            }
        }

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
