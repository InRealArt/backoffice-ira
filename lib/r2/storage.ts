"use client"

import { normalizeString } from '@/lib/utils'
import { convertToWebPIfNeeded } from '@/lib/utils/webp-converter'
import { getImageUrl } from '@/lib/r2/url'

/**
 * Interface pour les options d'upload
 */
interface UploadOptions {
    folder?: string
    artistFolder?: string
    itemSlug?: string
    fileName?: string
    isMain?: boolean
}

/**
 * Obtient une presigned PUT URL depuis la Route Handler et retourne {uploadUrl, relativePath}
 */
async function getPresignedUploadUrl(
    storagePath: string,
    contentType: string,
    fileSize?: number
): Promise<{ uploadUrl: string; relativePath: string }> {
    const response = await fetch('/api/r2/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath, contentType, fileSize }),
    })

    if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Erreur HTTP ${response.status} lors de la génération de la presigned URL`)
    }

    return response.json()
}

/**
 * Upload un fichier vers R2 via presigned PUT URL et retourne le chemin relatif du bucket
 * (ex: "artists/Jean Dupont/profile.webp")
 *
 * Les composants qui ont besoin de l'URL absolue doivent appeler getImageUrl() sur le résultat.
 */
async function uploadFileToR2(file: File | Blob, storagePath: string): Promise<string> {
    const contentType = file instanceof File ? file.type : (file as Blob).type || 'application/octet-stream'
    const { uploadUrl, relativePath } = await getPresignedUploadUrl(storagePath, contentType)

    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': contentType },
    })

    if (!uploadResponse.ok) {
        throw new Error(`Échec de l'upload vers R2: HTTP ${uploadResponse.status}`)
    }

    // Retourner le chemin relatif pour stockage en DB
    return relativePath
}

/**
 * Upload une image vers R2 et retourne son URL
 *
 * @param file - Le fichier à uploader
 * @param options - Options de configuration
 * @returns URL de l'image uploadée
 */
export async function uploadImageToFirebase(
    file: File,
    options: UploadOptions = {}
): Promise<string> {
    try {
        // Normaliser le nom du fichier
        const fileExtension = file.name.split('.').pop() || 'jpg'
        const normalizedFileName = options.fileName
            ? `${normalizeString(options.fileName)}.${fileExtension}`
            : `${Date.now()}-${normalizeString(file.name)}`

        // Construire le chemin de stockage
        const artistPath = options.artistFolder ? options.artistFolder : 'unknown-artist'
        console.log('✓ Chemin artiste final (sans transformation) :', artistPath);
        const itemPath = options.itemSlug ? `${normalizeString(options.itemSlug)}` : 'unknown-item'
        console.log('✓ Chemin item :', itemPath);

        // Déterminer le préfixe du nom de fichier selon qu'il s'agit de l'image principale ou non
        const filePrefix = options.isMain ? 'main' : `img-${Date.now()}`
        // Chemin complet
        const storagePath = `marketplace/${artistPath}/${itemPath}/${filePrefix}-${normalizedFileName}`
        console.log('✓ Chemin complet de stockage :', storagePath);

        return await uploadFileToR2(file, storagePath)
    } catch (error) {
        console.error('Erreur lors de l\'upload de l\'image vers R2:', error)
        throw new Error(`Échec de l'upload vers R2: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
}

/**
 * Upload plusieurs images vers R2
 *
 * @param files - Liste des fichiers à uploader
 * @param options - Options de configuration
 * @returns Tableau des URLs des images uploadées
 */
export async function uploadMultipleImagesToFirebase(
    files: File[],
    options: UploadOptions = {}
): Promise<string[]> {
    try {
        console.log(`Démarrage de l'upload multiple: ${files.length} fichiers`);
        console.log('Options d\'upload:', JSON.stringify({
            artistFolder: options.artistFolder,
            itemSlug: options.itemSlug,
            isMain: options.isMain
        }));

        const uploadPromises = files.map((file, index) => {
            console.log(`Préparation de l'upload du fichier ${index + 1}/${files.length}: ${file.name}`);
            return uploadImageToFirebase(file, {
                ...options,
                isMain: false
            });
        });

        // Exécuter tous les uploads en parallèle
        const urls = await Promise.all(uploadPromises);
        console.log(`${urls.length} fichiers uploadés avec succès:`, urls);
        return urls;
    } catch (error) {
        console.error('Erreur lors de l\'upload multiple d\'images vers R2:', error);
        throw new Error(`Échec de l'upload multiple vers R2: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
}

/**
 * Upload une image principale et des images secondaires
 *
 * @param mainImage - Image principale
 * @param secondaryImages - Images secondaires (optionnel)
 * @param options - Options de configuration
 * @returns Objet contenant l'URL de l'image principale et un tableau des URLs des images secondaires
 */
export async function uploadArtworkImages(
    mainImage: File,
    secondaryImages: File[] = [],
    options: UploadOptions = {}
): Promise<{ mainImageUrl: string, secondaryImageUrls: string[] }> {
    try {
        // Upload de l'image principale
        const mainImageUrl = await uploadImageToFirebase(mainImage, {
            ...options,
            isMain: true
        })

        // Upload des images secondaires (s'il y en a)
        const secondaryImageUrls = await uploadMultipleImagesToFirebase(secondaryImages, {
            ...options,
            isMain: false
        })

        return {
            mainImageUrl,
            secondaryImageUrls
        }
    } catch (error) {
        console.error('Erreur lors de l\'upload des images d\'œuvre vers R2:', error)
        throw new Error(`Échec de l'upload des images d'œuvre: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
}

/**
 * Extrait le chemin de stockage à partir d'une URL Firebase
 * Conservée pour la future migration BDD (les URLs existantes sont encore Firebase)
 *
 * @param url - URL Firebase Storage ou R2
 * @returns Le chemin de stockage extrait ou null si non trouvé
 */
export function extractFirebaseStoragePath(url: string): string | null {
    try {
        console.log('🔍 [extractFirebaseStoragePath] Extraction du chemin depuis:', url);

        // Les URLs Firebase Storage contiennent généralement un paramètre token
        // Format: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?alt=media&token=TOKEN
        // Le PATH peut être encodé (ex: artists%2FJean%20Dupont%2Fmarketplace%2Fclose_up%2F...)

        // Essayer plusieurs patterns pour être plus robuste
        let match = url.match(/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?]+)/);

        if (!match) {
            // Essayer un autre format possible
            match = url.match(/\/o\/([^?]+)/);
        }

        if (!match) {
            // Essayer avec le format gs://
            if (url.startsWith('gs://')) {
                const gsMatch = url.match(/gs:\/\/[^/]+\/(.+)/);
                if (gsMatch && gsMatch[1]) {
                    const decodedPath = decodeURIComponent(gsMatch[1]);
                    console.log('✅ [extractFirebaseStoragePath] Chemin extrait (gs://):', decodedPath);
                    return decodedPath;
                }
            }
        }

        if (match && match[1]) {
            // Décoder l'URL (Firebase encode les '/' en '%2F' et les espaces en '%20')
            let decodedPath = match[1];
            try {
                decodedPath = decodeURIComponent(decodedPath);
                // Si le décodage a fonctionné mais qu'il y a encore des %2F, essayer une deuxième fois
                if (decodedPath.includes('%2F') || decodedPath.includes('%20')) {
                    decodedPath = decodeURIComponent(decodedPath);
                }
            } catch (decodeError) {
                console.warn('⚠️ [extractFirebaseStoragePath] Erreur lors du décodage, utilisation du chemin brut:', decodeError);
            }

            console.log('✅ [extractFirebaseStoragePath] Chemin extrait:', decodedPath);
            return decodedPath;
        }

        console.error('❌ [extractFirebaseStoragePath] Aucun match trouvé dans l\'URL');
        console.error('❌ [extractFirebaseStoragePath] Format d\'URL attendu: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?alt=media&token=TOKEN');
        return null;
    } catch (error) {
        console.error('❌ [extractFirebaseStoragePath] Erreur lors de l\'extraction du chemin Firebase:', error);
        return null;
    }
}

/**
 * Upload une image d'artiste vers R2 dans le répertoire /artists/{artistName}
 *
 * @param file - Le fichier à uploader
 * @param fileName - Le nom du fichier (en camelCase, sans extension) - utilisé comme nom de répertoire
 * @returns URL de l'image uploadée
 */
export async function uploadArtistImageToFirebase(
    file: File,
    fileName: string
): Promise<string> {
    try {
        // Le fichier devrait déjà être en WebP à ce stade
        const fileExtension = 'webp'
        // Créer un répertoire par artiste : artists/{artistName}/profile.webp
        const storagePath = `artists/${fileName}/profile.${fileExtension}`

        console.log('✓ Upload de l\'image artiste vers:', storagePath)

        const downloadURL = await uploadFileToR2(file, storagePath)

        console.log('✓ Image artiste uploadée avec succès:', downloadURL)
        return downloadURL
    } catch (error) {
        console.error('Erreur lors de l\'upload de l\'image artiste vers R2:', error)
        throw new Error(`Échec de l'upload vers R2: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
}

/**
 * Options pour l'upload d'image d'artiste avec conversion WebP
 */
export interface UploadArtistImageOptions {
    /** Prénom de l'artiste */
    name: string
    /** Nom de l'artiste */
    surname: string
    /** Type d'image (profile, secondary, studio) */
    imageType?: 'profile' | 'secondary' | 'studio'
    /** Callback appelé lors du changement de statut de conversion */
    onConversionStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
    /** Callback appelé lors du changement de statut d'upload */
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
    /** Si true, normalise le nom du répertoire (minuscules, tirets). Sinon, garde la casse originale */
    normalizeFolderName?: boolean
}

/**
 * Upload une image d'artiste vers R2 avec conversion WebP automatique
 *
 * @param imageFile - Le fichier image à uploader
 * @param options - Options de configuration
 * @returns URL de l'image uploadée
 */
export async function uploadArtistImageWithWebP(
    imageFile: File,
    options: UploadArtistImageOptions
): Promise<string> {
    try {
        // Étape 1: Conversion WebP
        options.onConversionStatus?.('in-progress')
        const conversionResult = await convertToWebPIfNeeded(imageFile)

        if (!conversionResult.success) {
            const errorMessage =
                conversionResult.error ||
                "Erreur lors de la conversion de l'image en WebP"
            options.onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        options.onConversionStatus?.('completed')

        // Étape 2: Préparation du chemin de stockage
        const { name, surname, imageType = 'profile', normalizeFolderName = false } = options

        // Créer le nom du répertoire
        const folderName = normalizeFolderName
            ? normalizeString(`${name} ${surname}`)
            : `${name} ${surname}`.trim()

        // Déterminer le nom du fichier selon le type
        let filePrefix = `${name} ${surname}`
        if (imageType === 'secondary') {
            filePrefix = `${name} ${surname}_secondary`
        } else if (imageType === 'studio') {
            filePrefix = `${name} ${surname}_studio`
        }

        const fileExtension = 'webp'
        const storagePath = `artists/${folderName}/${filePrefix}.${fileExtension}`

        // Étape 3: Upload vers R2
        options.onUploadStatus?.('in-progress')
        const imageUrl = await uploadFileToR2(conversionResult.file, storagePath)

        options.onUploadStatus?.('completed')

        return imageUrl
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image d'artiste:", error)
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Erreur inconnue lors de l'upload"

        // Notifier les callbacks en cas d'erreur
        if (errorMessage.toLowerCase().includes('conversion') ||
            errorMessage.toLowerCase().includes('webp')) {
            options.onConversionStatus?.('error', errorMessage)
        } else {
            options.onUploadStatus?.('error', errorMessage)
        }

        throw error
    }
}

/**
 * checkFolderExists — R2 n'a pas de notion de dossier vide.
 * Retourne toujours true pour maintenir la compatibilité avec les composants existants.
 *
 * @param _folderPath - Chemin du répertoire (ignoré)
 * @returns Promise<true>
 */
export async function checkFolderExists(_folderPath: string): Promise<boolean> {
    // R2 n'a pas de notion de dossier vide : les "dossiers" sont implicites
    // dans les clés. On retourne toujours true.
    return true
}

/**
 * Upload une image secondaire ou studio dans un répertoire existant avec la casse exacte
 *
 * @param imageFile - Le fichier image à uploader
 * @param folderName - Nom du répertoire avec la casse exacte (ex: "Jean Dupont")
 * @param fileName - Nom du fichier (ex: "Jean Dupont_secondary" ou "Jean Dupont_studio")
 * @param onConversionStatus - Callback pour le statut de conversion
 * @param onUploadStatus - Callback pour le statut d'upload
 * @returns URL de l'image uploadée
 */
export async function uploadImageToExistingFolder(
    imageFile: File,
    folderName: string,
    fileName: string,
    onConversionStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void,
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
): Promise<string> {
    try {
        // Étape 1: Conversion WebP
        onConversionStatus?.('in-progress')
        const conversionResult = await convertToWebPIfNeeded(imageFile)

        if (!conversionResult.success) {
            const errorMessage =
                conversionResult.error ||
                "Erreur lors de la conversion de l'image en WebP"
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('completed')

        // Étape 2: Upload vers R2
        onUploadStatus?.('in-progress')
        const folderPath = `artists/${folderName}`
        const fileExtension = 'webp'
        const storagePath = `${folderPath}/${fileName}.${fileExtension}`

        const imageUrl = await uploadFileToR2(conversionResult.file, storagePath)

        onUploadStatus?.('completed')

        return imageUrl
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image:", error)
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Erreur inconnue lors de l'upload"

        // Notifier les callbacks en cas d'erreur
        if (errorMessage.toLowerCase().includes('conversion') ||
            errorMessage.toLowerCase().includes('webp')) {
            onConversionStatus?.('error', errorMessage)
        } else {
            onUploadStatus?.('error', errorMessage)
        }

        throw error
    }
}

/**
 * Supprime une image de R2
 * Pour les URLs Firebase existantes, extrait le chemin et tente la suppression sur R2.
 * Pour les URLs R2, extrait directement la clé.
 *
 * @param imageUrl - URL de l'image à supprimer
 * @returns Promise<boolean> - true si la suppression a réussi, false sinon
 */
export async function deleteImageFromFirebase(imageUrl: string): Promise<boolean> {
    try {
        console.log('🗑️ [deleteImageFromR2] Début de la suppression pour:', imageUrl);

        let storagePath: string | null = null

        // Chemin relatif (nouveau format BDD) : utiliser directement
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            storagePath = imageUrl
        } else {
            // Déterminer si c'est une URL R2 ou Firebase
            const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ''
            if (r2PublicUrl && imageUrl.startsWith(r2PublicUrl)) {
                // URL R2 absolue: extraire la clé en retirant l'URL de base
                storagePath = imageUrl.replace(r2PublicUrl + '/', '')
            } else {
                // URL Firebase: utiliser l'extracteur existant
                storagePath = extractFirebaseStoragePath(imageUrl)
            }
        }

        if (!storagePath) {
            console.error('❌ [deleteImageFromR2] Impossible d\'extraire le chemin de stockage depuis:', imageUrl);
            return false;
        }

        console.log(`📁 [deleteImageFromR2] Chemin de stockage extrait: ${storagePath}`);

        // Appel à la route API de suppression
        const response = await fetch('/api/r2/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storagePath }),
        })

        if (response.ok) {
            console.log(`✅ [deleteImageFromR2] Image supprimée avec succès: ${storagePath}`);
            return true;
        }

        if (response.status === 404) {
            console.log(`ℹ️ [deleteImageFromR2] Le fichier n'existe pas (déjà supprimé): ${storagePath}`)
            return true
        }

        console.error('❌ [deleteImageFromR2] Erreur lors de la suppression:', response.status);
        return false;
    } catch (error: any) {
        console.error('❌ [deleteImageFromR2] Erreur lors de la suppression de l\'image:', error);
        return false;
    }
}

/**
 * Supprime le fichier WebP d'un presaleArtwork depuis R2
 * Le fichier est stocké dans artists/{Prenom Nom}/landing/{nomoeuvre}.webp
 *
 * @param artistName - Prénom de l'artiste
 * @param artistSurname - Nom de l'artiste
 * @param artworkName - Nom de l'œuvre
 * @returns Promise<boolean> - true si la suppression a réussi, false sinon
 */
export async function deletePresaleArtworkImage(
    artistName: string,
    artistSurname: string,
    artworkName: string
): Promise<boolean> {
    try {
        // Construire le nom du répertoire avec la casse exacte (comme dans PresaleArtworkForm)
        const folderName = `${artistName} ${artistSurname}`.trim()

        // Normaliser le nom de l'œuvre (comme dans PresaleArtworkForm)
        const normalizedArtworkName = normalizeString(artworkName)

        // Construire le chemin complet
        const storagePath = `artists/${folderName}/landing/${normalizedArtworkName}.webp`

        console.log(`Tentative de suppression du fichier presaleArtwork: ${storagePath}`)

        const response = await fetch('/api/r2/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storagePath }),
        })

        if (response.ok || response.status === 404) {
            console.log(`Fichier presaleArtwork supprimé avec succès (ou inexistant): ${storagePath}`)
            return true
        }

        console.error('Erreur lors de la suppression du fichier presaleArtwork:', response.status)
        return false
    } catch (error: any) {
        console.error('Erreur lors de la suppression du fichier presaleArtwork:', error)
        return false
    }
}

/**
 * ensureFolderExists — R2 n'a pas de notion de dossier vide.
 * Retourne toujours true pour maintenir la compatibilité avec les composants existants.
 *
 * @param _folderPath - Chemin du répertoire (ignoré)
 * @param _name - Prénom de l'artiste (ignoré)
 * @param _surname - Nom de l'artiste (ignoré)
 * @returns Promise<true>
 */
export async function ensureFolderExists(
    _folderPath: string,
    _name: string,
    _surname: string
): Promise<boolean> {
    // R2 n'a pas de notion de dossier vide : les "dossiers" sont implicites.
    // On retourne toujours true pour maintenir la compatibilité.
    return true
}

/**
 * Upload une image vers R2 dans le répertoire landing d'un artiste.
 *
 * Flow (server-side conversion — évite FUNCTION_PAYLOAD_TOO_LARGE sur Vercel) :
 *   1. PUT du fichier brut vers une clé temp R2 via presigned URL (aucun binaire dans la réponse HTTP)
 *   2. Server Action convertAndFinalize : R2 temp → sharp WebP → R2 final key
 *   3. Suppression automatique de la clé temp par la Server Action
 *
 * @param imageFile - Le fichier image à uploader
 * @param folderName - Nom du répertoire avec la casse exacte (ex: "Jean Dupont")
 * @param fileName - Nom du fichier (sans extension)
 * @param onConversionStatus - Callback pour le statut de conversion
 * @param onUploadStatus - Callback pour le statut d'upload
 * @returns Chemin relatif de l'image dans le bucket (ex: "artists/Jean Dupont/landing/nom.webp")
 */
/** Maximum raw file size accepted by uploadImageToLandingFolder (4 MB). */
export const LANDING_IMAGE_MAX_SIZE_BYTES = 4 * 1024 * 1024

export async function uploadImageToLandingFolder(
    imageFile: File,
    folderName: string,
    fileName: string,
    onConversionStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void,
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
): Promise<string> {
    try {
        // Guard — earliest possible check, before any network call.
        if (imageFile.size > LANDING_IMAGE_MAX_SIZE_BYTES) {
            const sizeMB = (imageFile.size / (1024 * 1024)).toFixed(1)
            const errorMessage = `Fichier trop volumineux: ${imageFile.name} (${sizeMB} Mo). Maximum autorisé: 4 Mo.`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        // Step 1: Upload the raw file to a temp R2 key via presigned PUT URL.
        // onConversionStatus signals the raw-upload phase (client side, no conversion yet).
        onConversionStatus?.('in-progress')

        const { v4: uuidv4 } = await import('uuid')
        const tempKey = `temp/${uuidv4()}/${imageFile.name}`
        const { uploadUrl: tempUploadUrl } = await getPresignedUploadUrl(tempKey, imageFile.type, imageFile.size)

        const rawUploadResponse = await fetch(tempUploadUrl, {
            method: 'PUT',
            body: imageFile,
            headers: { 'Content-Type': imageFile.type },
        })

        if (!rawUploadResponse.ok) {
            const errorMessage = `Échec de l'upload brut vers R2 temp: HTTP ${rawUploadResponse.status}`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('completed')

        // Step 2: Call the Server Action to convert and write to final key.
        // The Server Action runs on the server: fetches from R2, pipes through sharp, uploads WebP back.
        onUploadStatus?.('in-progress')

        const finalKey = `artists/${folderName}/landing/${fileName}.webp`

        const { convertAndFinalize } = await import('@/lib/r2/actions/convert-and-finalize')
        const result = await convertAndFinalize(tempKey, finalKey)

        onUploadStatus?.('completed')

        return result.relativePath
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image landing:", error)
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Erreur inconnue lors de l'upload"

        if (errorMessage.toLowerCase().includes('conversion') ||
            errorMessage.toLowerCase().includes('webp') ||
            errorMessage.toLowerCase().includes('temp')) {
            onConversionStatus?.('error', errorMessage)
        } else {
            onUploadStatus?.('error', errorMessage)
        }

        throw error
    }
}

/**
 * Upload une image vers R2 dans le répertoire exhibitions/<Nom exposition>/
 *
 * @param imageFile - Le fichier image à uploader
 * @param exhibitionName - Nom de l'exposition (utilisé comme nom de dossier)
 * @param fileName - Nom du fichier (sans extension)
 * @param onConversionStatus - Callback pour le statut de conversion
 * @param onUploadStatus - Callback pour le statut d'upload
 * @returns URL de l'image uploadée
 */
export async function uploadImageToExhibitionFolder(
    imageFile: File,
    exhibitionName: string,
    fileName: string,
    onConversionStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void,
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
): Promise<string> {
    try {
        if (imageFile.size > LANDING_IMAGE_MAX_SIZE_BYTES) {
            const sizeMB = (imageFile.size / (1024 * 1024)).toFixed(1)
            const errorMessage = `Fichier trop volumineux: ${imageFile.name} (${sizeMB} Mo). Maximum autorisé: 4 Mo.`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('in-progress')

        const { v4: uuidv4 } = await import('uuid')
        const tempKey = `temp/${uuidv4()}/${imageFile.name}`
        const { uploadUrl: tempUploadUrl } = await getPresignedUploadUrl(tempKey, imageFile.type, imageFile.size)

        const rawUploadResponse = await fetch(tempUploadUrl, {
            method: 'PUT',
            body: imageFile,
            headers: { 'Content-Type': imageFile.type },
        })

        if (!rawUploadResponse.ok) {
            const errorMessage = `Échec de l'upload brut vers R2 temp: HTTP ${rawUploadResponse.status}`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('completed')

        onUploadStatus?.('in-progress')

        const finalKey = `exhibitions/${exhibitionName}/${fileName}.webp`

        const { convertAndFinalize } = await import('@/lib/r2/actions/convert-and-finalize')
        const result = await convertAndFinalize(tempKey, finalKey)

        onUploadStatus?.('completed')

        return result.relativePath
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image d'exposition:", error)
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Erreur inconnue lors de l'upload"

        if (errorMessage.toLowerCase().includes('conversion') ||
            errorMessage.toLowerCase().includes('webp') ||
            errorMessage.toLowerCase().includes('temp')) {
            onConversionStatus?.('error', errorMessage)
        } else {
            onUploadStatus?.('error', errorMessage)
        }

        throw error
    }
}

/**
 * Upload une image vers R2 dans le répertoire marketplace d'un artiste
 *
 * @param imageFile - Le fichier image à uploader
 * @param folderName - Nom du répertoire avec la casse exacte (ex: "Jean Dupont")
 * @param fileName - Nom du fichier (sans extension)
 * @param onConversionStatus - Callback pour le statut de conversion
 * @param onUploadStatus - Callback pour le statut d'upload
 * @returns URL de l'image uploadée
 */
export async function uploadImageToMarketplaceFolder(
    imageFile: File,
    folderName: string,
    fileName: string,
    onConversionStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void,
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
): Promise<string> {
    try {
        if (imageFile.size > LANDING_IMAGE_MAX_SIZE_BYTES) {
            const sizeMB = (imageFile.size / (1024 * 1024)).toFixed(1)
            const errorMessage = `Fichier trop volumineux: ${imageFile.name} (${sizeMB} Mo). Maximum autorisé: 4 Mo.`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('in-progress')

        const { v4: uuidv4 } = await import('uuid')
        const tempKey = `temp/${uuidv4()}/${imageFile.name}`
        const { uploadUrl: tempUploadUrl } = await getPresignedUploadUrl(tempKey, imageFile.type, imageFile.size)

        const rawUploadResponse = await fetch(tempUploadUrl, {
            method: 'PUT',
            body: imageFile,
            headers: { 'Content-Type': imageFile.type },
        })

        if (!rawUploadResponse.ok) {
            const errorMessage = `Échec de l'upload brut vers R2 temp: HTTP ${rawUploadResponse.status}`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('completed')

        onUploadStatus?.('in-progress')

        const finalKey = `artists/${folderName}/marketplace/${fileName}.webp`

        const { convertAndFinalize } = await import('@/lib/r2/actions/convert-and-finalize')
        const result = await convertAndFinalize(tempKey, finalKey)

        onUploadStatus?.('completed')

        return result.relativePath
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image:", error)
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Erreur inconnue lors de l'upload"

        if (errorMessage.toLowerCase().includes('conversion') ||
            errorMessage.toLowerCase().includes('webp') ||
            errorMessage.toLowerCase().includes('temp')) {
            onConversionStatus?.('error', errorMessage)
        } else {
            onUploadStatus?.('error', errorMessage)
        }

        throw error
    }
}

/**
 * Upload une image vers R2 dans le répertoire marketplace d'un artiste selon le type d'image
 * Crée le répertoire si nécessaire : /artists/{Prenom Nom}/marketplace/{type}/
 *
 * @param imageFile - Le fichier image à uploader
 * @param folderName - Nom du répertoire avec la casse exacte (ex: "Jean Dupont")
 * @param imageType - Type d'image (CLOSE_UP, SIGNATURE, SIDE_VIEW, BACK_VIEW, IN_SITU, OTHER)
 * @param fileName - Nom du fichier (sans extension)
 * @param onConversionStatus - Callback pour le statut de conversion
 * @param onUploadStatus - Callback pour le statut d'upload
 * @returns URL de l'image uploadée
 */
export async function uploadImageToMarketplaceFolderByType(
    imageFile: File,
    folderName: string,
    imageType: string,
    fileName: string,
    onConversionStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void,
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
): Promise<string> {
    try {
        if (imageFile.size > LANDING_IMAGE_MAX_SIZE_BYTES) {
            const sizeMB = (imageFile.size / (1024 * 1024)).toFixed(1)
            const errorMessage = `Fichier trop volumineux: ${imageFile.name} (${sizeMB} Mo). Maximum autorisé: 4 Mo.`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        // Capture timestamp before async calls to stay deterministic
        const timestamp = Date.now()

        onConversionStatus?.('in-progress')

        const { v4: uuidv4 } = await import('uuid')
        const tempKey = `temp/${uuidv4()}/${imageFile.name}`
        const { uploadUrl: tempUploadUrl } = await getPresignedUploadUrl(tempKey, imageFile.type, imageFile.size)

        const rawUploadResponse = await fetch(tempUploadUrl, {
            method: 'PUT',
            body: imageFile,
            headers: { 'Content-Type': imageFile.type },
        })

        if (!rawUploadResponse.ok) {
            const errorMessage = `Échec de l'upload brut vers R2 temp: HTTP ${rawUploadResponse.status}`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('completed')

        onUploadStatus?.('in-progress')

        const finalKey = `artists/${folderName}/marketplace/${imageType.toLowerCase()}/${fileName}-${timestamp}.webp`

        const { convertAndFinalize } = await import('@/lib/r2/actions/convert-and-finalize')
        const result = await convertAndFinalize(tempKey, finalKey)

        onUploadStatus?.('completed')

        return result.relativePath
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image par type:", error)
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Erreur inconnue lors de l'upload"

        if (errorMessage.toLowerCase().includes('conversion') ||
            errorMessage.toLowerCase().includes('webp') ||
            errorMessage.toLowerCase().includes('temp')) {
            onConversionStatus?.('error', errorMessage)
        } else {
            onUploadStatus?.('error', errorMessage)
        }

        throw error
    }
}

/**
 * Upload une image vers R2 dans le répertoire artistsUGC
 *
 * @param imageFile - Le fichier image à uploader
 * @param folderName - Nom du répertoire (ex: "Jean Dupont" ou pseudo)
 * @param fileName - Nom du fichier (sans extension)
 * @param onConversionStatus - Callback statut conversion
 * @param onUploadStatus - Callback statut upload
 * @returns URL de l'image uploadée
 */
export async function uploadImageToUgcFolder(
    imageFile: File,
    folderName: string,
    fileName: string,
    onConversionStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void,
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
): Promise<string> {
    try {
        if (imageFile.size > LANDING_IMAGE_MAX_SIZE_BYTES) {
            const sizeMB = (imageFile.size / (1024 * 1024)).toFixed(1)
            const errorMessage = `Fichier trop volumineux: ${imageFile.name} (${sizeMB} Mo). Maximum autorisé: 4 Mo.`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('in-progress')

        const { v4: uuidv4 } = await import('uuid')
        const tempKey = `temp/${uuidv4()}/${imageFile.name}`
        const { uploadUrl: tempUploadUrl } = await getPresignedUploadUrl(tempKey, imageFile.type, imageFile.size)

        const rawUploadResponse = await fetch(tempUploadUrl, {
            method: 'PUT',
            body: imageFile,
            headers: { 'Content-Type': imageFile.type },
        })

        if (!rawUploadResponse.ok) {
            const errorMessage = `Échec de l'upload brut vers R2 temp: HTTP ${rawUploadResponse.status}`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('completed')

        onUploadStatus?.('in-progress')

        const finalKey = `artistsUGC/${folderName}/${fileName}.webp`

        const { convertAndFinalize } = await import('@/lib/r2/actions/convert-and-finalize')
        const result = await convertAndFinalize(tempKey, finalKey)

        onUploadStatus?.('completed')

        return result.relativePath
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image UGC:", error)
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors de l'upload"

        if (errorMessage.toLowerCase().includes('temp')) {
            onConversionStatus?.('error', errorMessage)
        } else {
            onUploadStatus?.('error', errorMessage)
        }

        throw new Error(errorMessage)
    }
}

/**
 * Upload un média (image ou vidéo) vers R2 dans le répertoire artistsUGC
 * - Images : conversion WebP automatique
 * - Vidéos : upload direct sans conversion
 *
 * @param mediaFile - Le fichier à uploader (image ou vidéo)
 * @param folderName - Nom du répertoire (ex: "Jean Dupont" ou pseudo)
 * @param fileName - Nom du fichier (sans extension)
 * @param onUploadStatus - Callback statut upload
 * @returns URL du média uploadé
 */
export async function uploadMediaToUgcFolder(
    mediaFile: File,
    folderName: string,
    fileName: string,
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
): Promise<string> {
    try {
        const isVideo = mediaFile.type.startsWith('video/')

        if (isVideo) {
            // Upload direct pour les vidéos — pas de conversion, pas de limite de taille
            onUploadStatus?.('in-progress')
            const ext = mediaFile.name.split('.').pop() || 'mp4'
            const storagePath = `artistsUGC/${folderName}/${fileName}.${ext}`
            const mediaUrl = await uploadFileToR2(mediaFile, storagePath)
            onUploadStatus?.('completed')
            return mediaUrl
        } else {
            // Images: size guard + presigned PUT to temp + Server Action convertAndFinalize
            if (mediaFile.size > LANDING_IMAGE_MAX_SIZE_BYTES) {
                const sizeMB = (mediaFile.size / (1024 * 1024)).toFixed(1)
                const errorMessage = `Fichier trop volumineux: ${mediaFile.name} (${sizeMB} Mo). Maximum autorisé: 4 Mo.`
                onUploadStatus?.('error', errorMessage)
                throw new Error(errorMessage)
            }

            onUploadStatus?.('in-progress')

            const { v4: uuidv4 } = await import('uuid')
            const tempKey = `temp/${uuidv4()}/${mediaFile.name}`
            const { uploadUrl: tempUploadUrl } = await getPresignedUploadUrl(tempKey, mediaFile.type, mediaFile.size)

            const rawUploadResponse = await fetch(tempUploadUrl, {
                method: 'PUT',
                body: mediaFile,
                headers: { 'Content-Type': mediaFile.type },
            })

            if (!rawUploadResponse.ok) {
                const errorMessage = `Échec de l'upload brut vers R2 temp: HTTP ${rawUploadResponse.status}`
                onUploadStatus?.('error', errorMessage)
                throw new Error(errorMessage)
            }

            const finalKey = `artistsUGC/${folderName}/${fileName}.webp`

            const { convertAndFinalize } = await import('@/lib/r2/actions/convert-and-finalize')
            const result = await convertAndFinalize(tempKey, finalKey)

            onUploadStatus?.('completed')
            return result.relativePath
        }
    } catch (error) {
        console.error("Erreur lors de l'upload du média UGC:", error)
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors de l'upload"
        onUploadStatus?.('error', errorMessage)
        throw new Error(errorMessage)
    }
}

/**
 * Upload une image de mockup vers R2 dans le répertoire /artists/{Prenom Nom}/mockups
 *
 * @param imageFile - Le fichier image à uploader
 * @param name - Prénom de l'artiste
 * @param surname - Nom de l'artiste
 * @param fileName - Nom du fichier (sans extension, optionnel, par défaut timestamp)
 * @param onConversionStatus - Callback pour le statut de conversion
 * @param onUploadStatus - Callback pour le statut d'upload
 * @returns URL de l'image uploadée
 */
export async function uploadMockupToFirebase(
    imageFile: File,
    name: string,
    surname: string,
    fileName?: string,
    onConversionStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void,
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
): Promise<string> {
    try {
        // Étape 1: Conversion WebP
        onConversionStatus?.('in-progress')
        const conversionResult = await convertToWebPIfNeeded(imageFile)

        if (!conversionResult.success) {
            const errorMessage =
                conversionResult.error ||
                "Erreur lors de la conversion de l'image en WebP"
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('completed')

        // Étape 2: Préparation du chemin de stockage
        const folderName = `${name} ${surname}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
            .replace(/[^a-zA-Z0-9\s]+/g, '') // Supprime les caractères spéciaux sauf espaces
            .trim()

        // Nom du fichier (avec timestamp si non fourni)
        const finalFileName = fileName || `mockup-${Date.now()}`
        const fileExtension = 'webp'
        const storagePath = `artists/${folderName}/mockups/${finalFileName}.${fileExtension}`

        // Étape 3: Upload vers R2
        onUploadStatus?.('in-progress')
        const imageUrl = await uploadFileToR2(conversionResult.file, storagePath)

        onUploadStatus?.('completed')

        return imageUrl
    } catch (error) {
        console.error("Erreur lors de l'upload du mockup:", error)
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Erreur inconnue lors de l'upload"

        // Notifier les callbacks en cas d'erreur
        if (errorMessage.toLowerCase().includes('conversion') ||
            errorMessage.toLowerCase().includes('webp')) {
            onConversionStatus?.('error', errorMessage)
        } else {
            onUploadStatus?.('error', errorMessage)
        }

        throw error
    }
}

/**
 * Upload une image d'artiste vers R2 dans le répertoire galleryLj/artists/<artistSlug>/
 *
 * Chemin : galleryLj/artists/<artistSlug>/main_image.webp
 *
 * @param imageFile - Le fichier image à uploader
 * @param artistSlug - Slug de l'artiste (slugifié, sans espaces ni accents)
 * @param fileName - Nom du fichier (sans extension, ex: "main_image")
 * @param onConversionStatus - Callback pour le statut de conversion
 * @param onUploadStatus - Callback pour le statut d'upload
 * @returns Chemin relatif du fichier uploadé
 */
export async function uploadGalleryLjArtistImage(
    imageFile: File,
    artistSlug: string,
    fileName: string,
    onConversionStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void,
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
): Promise<string> {
    try {
        if (imageFile.size > LANDING_IMAGE_MAX_SIZE_BYTES) {
            const sizeMB = (imageFile.size / (1024 * 1024)).toFixed(1)
            const errorMessage = `Fichier trop volumineux: ${imageFile.name} (${sizeMB} Mo). Maximum autorisé: 4 Mo.`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('in-progress')

        const { v4: uuidv4 } = await import('uuid')
        const tempKey = `temp/${uuidv4()}/${imageFile.name}`
        const { uploadUrl: tempUploadUrl } = await getPresignedUploadUrl(tempKey, imageFile.type, imageFile.size)

        const rawUploadResponse = await fetch(tempUploadUrl, {
            method: 'PUT',
            body: imageFile,
            headers: { 'Content-Type': imageFile.type },
        })

        if (!rawUploadResponse.ok) {
            const errorMessage = `Échec de l'upload brut vers R2 temp: HTTP ${rawUploadResponse.status}`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('completed')

        onUploadStatus?.('in-progress')

        const finalKey = `galleryLj/artists/${artistSlug}/${fileName}.webp`

        const { convertAndFinalize } = await import('@/lib/r2/actions/convert-and-finalize')
        const result = await convertAndFinalize(tempKey, finalKey)

        onUploadStatus?.('completed')

        return result.relativePath
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image artiste galerie LJ:", error)
        const errorMessage =
            error instanceof Error ? error.message : "Erreur inconnue lors de l'upload"
        if (
            errorMessage.toLowerCase().includes('conversion') ||
            errorMessage.toLowerCase().includes('webp') ||
            errorMessage.toLowerCase().includes('temp')
        ) {
            onConversionStatus?.('error', errorMessage)
        } else {
            onUploadStatus?.('error', errorMessage)
        }
        throw error
    }
}

/**
 * Upload une image d'œuvre vers R2 dans le répertoire galleryLj/artists/<artistSlug>/artworks/<artworkSlug>/
 *
 * Chemin : galleryLj/artists/<artistSlug>/artworks/<artworkSlug>/<artworkSlug>.webp
 *
 * @param imageFile - Le fichier image à uploader
 * @param artistSlug - Slug de l'artiste (slugifié, sans espaces ni accents)
 * @param artworkSlug - Slug du titre de l'œuvre (slugifié, sans espaces ni accents)
 * @param onConversionStatus - Callback pour le statut de conversion
 * @param onUploadStatus - Callback pour le statut d'upload
 * @returns Chemin relatif du fichier uploadé
 */
export async function uploadGalleryLjArtworkImage(
    imageFile: File,
    artistSlug: string,
    artworkSlug: string,
    onConversionStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void,
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
): Promise<string> {
    try {
        if (imageFile.size > LANDING_IMAGE_MAX_SIZE_BYTES) {
            const sizeMB = (imageFile.size / (1024 * 1024)).toFixed(1)
            const errorMessage = `Fichier trop volumineux: ${imageFile.name} (${sizeMB} Mo). Maximum autorisé: 4 Mo.`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('in-progress')

        const { v4: uuidv4 } = await import('uuid')
        const tempKey = `temp/${uuidv4()}/${imageFile.name}`
        const { uploadUrl: tempUploadUrl } = await getPresignedUploadUrl(tempKey, imageFile.type, imageFile.size)

        const rawUploadResponse = await fetch(tempUploadUrl, {
            method: 'PUT',
            body: imageFile,
            headers: { 'Content-Type': imageFile.type },
        })

        if (!rawUploadResponse.ok) {
            const errorMessage = `Échec de l'upload brut vers R2 temp: HTTP ${rawUploadResponse.status}`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('completed')

        onUploadStatus?.('in-progress')

        const finalKey = `galleryLj/artists/${artistSlug}/artworks/${artworkSlug}/${artworkSlug}.webp`

        const { convertAndFinalize } = await import('@/lib/r2/actions/convert-and-finalize')
        const result = await convertAndFinalize(tempKey, finalKey)

        onUploadStatus?.('completed')

        return result.relativePath
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image œuvre galerie LJ:", error)
        const errorMessage =
            error instanceof Error ? error.message : "Erreur inconnue lors de l'upload"
        if (
            errorMessage.toLowerCase().includes('conversion') ||
            errorMessage.toLowerCase().includes('webp') ||
            errorMessage.toLowerCase().includes('temp')
        ) {
            onConversionStatus?.('error', errorMessage)
        } else {
            onUploadStatus?.('error', errorMessage)
        }
        throw error
    }
}

/**
 * Upload une image secondaire d'œuvre vers R2 dans le répertoire galleryLj/artists/<artistSlug>/artworks/<artworkSlug>/
 *
 * Chemin : galleryLj/artists/<artistSlug>/artworks/<artworkSlug>/<artworkSlug>-<timestamp>.webp
 *
 * @param imageFile - Le fichier image à uploader
 * @param artistSlug - Slug de l'artiste (slugifié, sans espaces ni accents)
 * @param artworkSlug - Slug du titre de l'œuvre (slugifié, sans espaces ni accents)
 * @param onConversionStatus - Callback pour le statut de conversion
 * @param onUploadStatus - Callback pour le statut d'upload
 * @returns Chemin relatif du fichier uploadé
 */
export async function uploadGalleryLjArtworkSecondaryImage(
    imageFile: File,
    artistSlug: string,
    artworkSlug: string,
    onConversionStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void,
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
): Promise<string> {
    try {
        if (imageFile.size > LANDING_IMAGE_MAX_SIZE_BYTES) {
            const sizeMB = (imageFile.size / (1024 * 1024)).toFixed(1)
            const errorMessage = `Fichier trop volumineux: ${imageFile.name} (${sizeMB} Mo). Maximum autorisé: 4 Mo.`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        // Capture timestamp before async calls to stay deterministic
        const timestamp = Date.now()

        onConversionStatus?.('in-progress')

        const { v4: uuidv4 } = await import('uuid')
        const tempKey = `temp/${uuidv4()}/${imageFile.name}`
        const { uploadUrl: tempUploadUrl } = await getPresignedUploadUrl(tempKey, imageFile.type, imageFile.size)

        const rawUploadResponse = await fetch(tempUploadUrl, {
            method: 'PUT',
            body: imageFile,
            headers: { 'Content-Type': imageFile.type },
        })

        if (!rawUploadResponse.ok) {
            const errorMessage = `Échec de l'upload brut vers R2 temp: HTTP ${rawUploadResponse.status}`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('completed')

        onUploadStatus?.('in-progress')

        const finalKey = `galleryLj/artists/${artistSlug}/artworks/${artworkSlug}/${artworkSlug}-${timestamp}.webp`

        const { convertAndFinalize } = await import('@/lib/r2/actions/convert-and-finalize')
        const result = await convertAndFinalize(tempKey, finalKey)

        onUploadStatus?.('completed')

        return result.relativePath
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image secondaire œuvre galerie LJ:", error)
        const errorMessage =
            error instanceof Error ? error.message : "Erreur inconnue lors de l'upload"
        if (
            errorMessage.toLowerCase().includes('conversion') ||
            errorMessage.toLowerCase().includes('webp') ||
            errorMessage.toLowerCase().includes('temp')
        ) {
            onConversionStatus?.('error', errorMessage)
        } else {
            onUploadStatus?.('error', errorMessage)
        }
        throw error
    }
}

/**
 * Upload une image d'exposition vers R2 dans le répertoire galleryLj/exhibitions/
 *
 * Chemin : galleryLj/exhibitions/<exhibitionSlug>/main-image.webp
 *
 * @param imageFile - Le fichier image à uploader
 * @param exhibitionSlug - Slug du nom de l'exposition (slugifié, sans espaces ni accents)
 * @param onConversionStatus - Callback pour le statut de conversion
 * @param onUploadStatus - Callback pour le statut d'upload
 * @returns Chemin relatif du fichier uploadé
 */
export async function uploadGalleryLjExhibitionImage(
    imageFile: File,
    exhibitionSlug: string,
    onConversionStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void,
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
): Promise<string> {
    try {
        if (imageFile.size > LANDING_IMAGE_MAX_SIZE_BYTES) {
            const sizeMB = (imageFile.size / (1024 * 1024)).toFixed(1)
            const errorMessage = `Fichier trop volumineux: ${imageFile.name} (${sizeMB} Mo). Maximum autorisé: 4 Mo.`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('in-progress')

        const { v4: uuidv4 } = await import('uuid')
        const tempKey = `temp/${uuidv4()}/${imageFile.name}`
        const { uploadUrl: tempUploadUrl } = await getPresignedUploadUrl(tempKey, imageFile.type, imageFile.size)

        const rawUploadResponse = await fetch(tempUploadUrl, {
            method: 'PUT',
            body: imageFile,
            headers: { 'Content-Type': imageFile.type },
        })

        if (!rawUploadResponse.ok) {
            const errorMessage = `Échec de l'upload brut vers R2 temp: HTTP ${rawUploadResponse.status}`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('completed')

        onUploadStatus?.('in-progress')

        const finalKey = `galleryLj/exhibitions/${exhibitionSlug}/main-image.webp`

        const { convertAndFinalize } = await import('@/lib/r2/actions/convert-and-finalize')
        const result = await convertAndFinalize(tempKey, finalKey)

        onUploadStatus?.('completed')

        return result.relativePath
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image exposition galerie LJ:", error)
        const errorMessage =
            error instanceof Error ? error.message : "Erreur inconnue lors de l'upload"
        if (
            errorMessage.toLowerCase().includes('conversion') ||
            errorMessage.toLowerCase().includes('webp') ||
            errorMessage.toLowerCase().includes('temp')
        ) {
            onConversionStatus?.('error', errorMessage)
        } else {
            onUploadStatus?.('error', errorMessage)
        }
        throw error
    }
}
