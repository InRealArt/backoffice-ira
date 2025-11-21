/**
 * Utilitaire pour la conversion d'images en WebP côté serveur
 * À utiliser dans les Server Actions uniquement
 */

import sharp from 'sharp'

interface ConversionResult {
    success: boolean
    file: File
    wasConverted: boolean
    originalSize?: number
    convertedSize?: number
    compressionRatio?: number
    error?: string
}

/**
 * Vérifie si un fichier est déjà au format WebP
 */
export function isWebPFormat(file: File): boolean {
    return file.type === 'image/webp'
}

/**
 * Convertit une image en WebP côté serveur en utilisant Sharp directement
 * Si l'image est déjà en WebP, retourne le fichier original
 * 
 * Cette fonction est conçue pour être utilisée dans les Server Actions
 */
export async function convertToWebPServer(file: File): Promise<ConversionResult> {
    try {
        // Si c'est déjà du WebP, on retourne le fichier tel quel
        if (isWebPFormat(file)) {
            console.log(`✓ Fichier ${file.name} est déjà au format WebP, pas de conversion nécessaire`)
            return {
                success: true,
                file: file,
                wasConverted: false
            }
        }

        console.log(`🔄 Conversion du fichier ${file.name} (${file.type}) en WebP...`)

        // Vérifier le type de fichier
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff']
        if (!validTypes.includes(file.type)) {
            throw new Error(`Type de fichier non supporté: ${file.type}`)
        }

        // Vérifier la taille du fichier (limite à 10MB)
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

        // Convertir en WebP avec Sharp
        const webpBuffer = await sharp(buffer)
            .resize(1920, 1920, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({
                quality: 80,
                effort: 4,
                smartSubsample: true,
                lossless: false
            })
            .timeout({ seconds: 10 })
            .toBuffer()

        const originalSize = buffer.length
        const convertedSize = webpBuffer.length
        const compressionRatio = ((originalSize - convertedSize) / originalSize) * 100

        // Créer un nouveau File à partir du buffer WebP
        const webpFile = new File([new Uint8Array(webpBuffer)], outputFileName, {
            type: 'image/webp'
        })

        console.log(`✅ Conversion réussie: ${originalName} → ${outputFileName}`)
        console.log(`📦 Taille originale: ${Math.round(originalSize / 1024)}KB`)
        console.log(`📦 Taille convertie: ${Math.round(convertedSize / 1024)}KB`)
        console.log(`📊 Compression: ${Math.max(0, compressionRatio).toFixed(1)}%`)

        return {
            success: true,
            file: webpFile,
            wasConverted: true,
            originalSize,
            convertedSize,
            compressionRatio: Math.max(0, compressionRatio)
        }

    } catch (error) {
        console.error(`❌ Erreur lors de la conversion de ${file.name}:`, error)

        // En cas d'erreur, on retourne le fichier original avec un flag d'erreur
        return {
            success: false,
            file: file,
            wasConverted: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue lors de la conversion'
        }
    }
}
