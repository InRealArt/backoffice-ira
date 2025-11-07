/**
 * Utilitaire pour la conversion d'images en WebP
 */

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
 * Convertit une image en WebP via l'API de conversion existante
 * Si l'image est déjà en WebP, retourne le fichier original
 */
export async function convertToWebPIfNeeded(file: File): Promise<ConversionResult> {
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

        // Préparer la requête vers l'API de conversion
        const formData = new FormData()
        formData.append('images', file)

        // Appeler l'API de conversion WebP
        const response = await fetch('/api/tools/webp-converter', {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Erreur lors de la conversion: ${response.status} ${response.statusText} - ${errorText}`)
        }

        const result = await response.json()

        if (!result.success || !result.convertedImages || result.convertedImages.length === 0) {
            throw new Error('Aucune image convertie retournée par l\'API')
        }

        const convertedImage = result.convertedImages[0]

        // Convertir les données base64 en File
        const base64Data = convertedImage.base64Data
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
        }

        const byteArray = new Uint8Array(byteNumbers)
        const webpFile = new File([byteArray], convertedImage.outputFileName, {
            type: 'image/webp'
        })

        console.log(`✅ Conversion réussie: ${convertedImage.originalName} → ${convertedImage.outputFileName}`)
        console.log(`📦 Taille originale: ${Math.round(convertedImage.originalSize / 1024)}KB`)
        console.log(`📦 Taille convertie: ${Math.round(convertedImage.convertedSize / 1024)}KB`)
        console.log(`📊 Compression: ${convertedImage.compressionRatio.toFixed(1)}%`)

        return {
            success: true,
            file: webpFile,
            wasConverted: true,
            originalSize: convertedImage.originalSize,
            convertedSize: convertedImage.convertedSize,
            compressionRatio: convertedImage.compressionRatio
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

/**
 * Convertit plusieurs images en WebP via l'API de conversion
 * Filtre automatiquement les images déjà en WebP
 */
export async function convertMultipleToWebP(files: File[]): Promise<ConversionResult[]> {
    console.log(`🔄 Conversion de ${files.length} images en WebP...`)

    const results: ConversionResult[] = []

    // Séparer les fichiers WebP des autres
    const webpFiles: File[] = []
    const nonWebpFiles: File[] = []

    files.forEach(file => {
        if (isWebPFormat(file)) {
            webpFiles.push(file)
        } else {
            nonWebpFiles.push(file)
        }
    })

    // Ajouter les fichiers WebP tels quels
    webpFiles.forEach(file => {
        results.push({
            success: true,
            file: file,
            wasConverted: false
        })
    })

    // Si il n'y a pas de fichiers à convertir, on retourne les résultats
    if (nonWebpFiles.length === 0) {
        console.log(`✓ Tous les fichiers sont déjà au format WebP`)
        return results
    }

    try {
        // Préparer la requête pour les fichiers non-WebP
        const formData = new FormData()
        nonWebpFiles.forEach(file => {
            formData.append('images', file)
        })

        // Appeler l'API de conversion WebP
        const response = await fetch('/api/tools/webp-converter', {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Erreur lors de la conversion multiple: ${response.status} ${response.statusText} - ${errorText}`)
        }

        const result = await response.json()

        if (!result.success || !result.convertedImages) {
            throw new Error('Erreur dans la réponse de l\'API de conversion')
        }

        // Traiter chaque image convertie
        for (const convertedImage of result.convertedImages) {
            const base64Data = convertedImage.base64Data
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }

            const byteArray = new Uint8Array(byteNumbers)
            const webpFile = new File([byteArray], convertedImage.outputFileName, {
                type: 'image/webp'
            })

            results.push({
                success: true,
                file: webpFile,
                wasConverted: true,
                originalSize: convertedImage.originalSize,
                convertedSize: convertedImage.convertedSize,
                compressionRatio: convertedImage.compressionRatio
            })
        }

        console.log(`✅ Conversion multiple réussie: ${result.convertedImages.length} images converties`)

    } catch (error) {
        console.error('❌ Erreur lors de la conversion multiple:', error)

        // En cas d'erreur, ajouter les fichiers originaux avec flag d'erreur
        nonWebpFiles.forEach(file => {
            results.push({
                success: false,
                file: file,
                wasConverted: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue lors de la conversion'
            })
        })
    }

    return results
}
