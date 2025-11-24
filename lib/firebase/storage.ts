import { ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata } from 'firebase/storage'
import { storage } from './config'
import { normalizeString } from '@/lib/utils'
import { convertToWebPIfNeeded } from '@/lib/utils/webp-converter'

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
 * Upload une image vers Firebase Storage et retourne son URL
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

        // Créer une référence au fichier dans Firebase Storage
        const storageRef = ref(storage, storagePath)

        // Upload du fichier
        const snapshot = await uploadBytes(storageRef, file)

        // Récupérer l'URL de téléchargement
        const downloadURL = await getDownloadURL(snapshot.ref)

        return downloadURL
    } catch (error) {
        console.error('Erreur lors de l\'upload de l\'image vers Firebase:', error)
        throw new Error(`Échec de l'upload vers Firebase: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
}

/**
 * Upload plusieurs images vers Firebase Storage
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
        console.error('Erreur lors de l\'upload multiple d\'images vers Firebase:', error);
        throw new Error(`Échec de l'upload multiple vers Firebase: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
        console.error('Erreur lors de l\'upload des images d\'œuvre vers Firebase:', error)
        throw new Error(`Échec de l'upload des images d'œuvre: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
}

/**
 * Extrait le chemin de stockage à partir d'une URL Firebase
 * 
 * @param url - URL Firebase Storage
 * @returns Le chemin de stockage extrait ou null si non trouvé
 */
export function extractFirebaseStoragePath(url: string): string | null {
    try {
        // Les URLs Firebase Storage contiennent généralement un paramètre token
        // Format: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?alt=media&token=TOKEN
        const regex = /firebasestorage\.googleapis\.com\/v0\/b\/[^\/]+\/o\/([^?]+)/;
        const match = url.match(regex);

        if (match && match[1]) {
            // Décoder l'URL (Firebase encode les '/' en '%2F')
            return decodeURIComponent(match[1]);
        }

        return null;
    } catch (error) {
        console.error('Erreur lors de l\'extraction du chemin Firebase:', error);
        return null;
    }
}

/**
 * Upload une image d'artiste vers Firebase Storage dans le répertoire /artists/{artistName}
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

        // Créer une référence au fichier dans Firebase Storage
        const storageRef = ref(storage, storagePath)

        // Upload du fichier
        const snapshot = await uploadBytes(storageRef, file)

        // Récupérer l'URL de téléchargement
        const downloadURL = await getDownloadURL(snapshot.ref)

        console.log('✓ Image artiste uploadée avec succès:', downloadURL)
        return downloadURL
    } catch (error) {
        console.error('Erreur lors de l\'upload de l\'image artiste vers Firebase:', error)
        throw new Error(`Échec de l'upload vers Firebase: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
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
 * Upload une image d'artiste vers Firebase Storage avec conversion WebP automatique
 * 
 * Cette fonction gère :
 * - L'authentification Firebase anonyme
 * - La conversion automatique en WebP
 * - L'upload vers le répertoire /artists/{nom-artiste}/
 * - Les callbacks de progression pour l'UI
 * 
 * @param imageFile - Le fichier image à uploader
 * @param options - Options de configuration
 * @returns URL de l'image uploadée
 * 
 * @example
 * ```typescript
 * const imageUrl = await uploadArtistImageWithWebP(file, {
 *   name: 'Jean',
 *   surname: 'Dupont',
 *   imageType: 'profile',
 *   onConversionStatus: (status) => console.log('Conversion:', status),
 *   onUploadStatus: (status) => console.log('Upload:', status)
 * })
 * ```
 */
export async function uploadArtistImageWithWebP(
    imageFile: File,
    options: UploadArtistImageOptions
): Promise<string> {
    try {
        // Étape 1: Authentification Firebase côté client
        const { getAuth, signInAnonymously } = await import('firebase/auth')
        const { app } = await import('./config')

        const auth = getAuth(app)
        await signInAnonymously(auth)

        // Étape 2: Conversion WebP
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

        // Étape 3: Préparation du chemin de stockage
        const { name, surname, imageType = 'profile', normalizeFolderName = true } = options

        // Créer le nom du répertoire
        const folderName = normalizeFolderName
            ? normalizeString(`${name} ${surname}`)
            : `${name} ${surname}`
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
                .replace(/[^a-zA-Z0-9\s]+/g, '') // Supprime les caractères spéciaux sauf espaces
                .trim()

        // Déterminer le nom du fichier selon le type
        let filePrefix = `${name} ${surname}`
        if (imageType === 'secondary') {
            filePrefix = `${name} ${surname}_2`
        } else if (imageType === 'studio') {
            filePrefix = `${name} ${surname}_studio`
        }

        const fileExtension = 'webp'
        const storagePath = `artists/${folderName}/${filePrefix}.${fileExtension}`

        // Étape 4: Upload vers Firebase
        options.onUploadStatus?.('in-progress')
        const storageRef = ref(storage, storagePath)

        await uploadBytes(storageRef, conversionResult.file)
        const imageUrl = await getDownloadURL(storageRef)

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
 * Vérifie si un répertoire existe dans Firebase Storage
 * En vérifiant l'existence d'un fichier qui devrait être présent (le fichier profile de l'artiste)
 * 
 * @param folderPath - Chemin du répertoire (ex: "artists/Jean Dupont")
 * @param name - Prénom de l'artiste
 * @param surname - Nom de l'artiste
 * @returns Promise<boolean> - true si le répertoire existe, false sinon
 */
export async function checkFolderExists(folderPath: string, name: string, surname: string): Promise<boolean> {
    try {
        // Vérifier l'existence du répertoire en essayant d'accéder au fichier profile qui devrait exister
        // Le fichier profile devrait être nommé : "{name} {surname}.webp"
        const profileFileName = `${name} ${surname}.webp`
        const profileFilePath = `${folderPath}/${profileFileName}`
        const profileFileRef = ref(storage, profileFilePath)

        try {
            // Essayer d'accéder aux métadonnées du fichier profile
            await getMetadata(profileFileRef)
            return true
        } catch (metadataError: any) {
            // Si le fichier profile n'existe pas, essayer de lister le contenu du dossier
            // pour voir s'il y a d'autres fichiers
            try {
                const folderRef = ref(storage, folderPath)
                const result = await listAll(folderRef)
                // Si on peut lister le dossier et qu'il contient au moins un fichier, le dossier existe
                return result.items.length > 0
            } catch (listError: any) {
                // Si on ne peut pas lister le dossier, il n'existe probablement pas
                console.error('Erreur lors de la vérification du répertoire:', listError)
                return false
            }
        }
    } catch (error: any) {
        console.error('Erreur lors de la vérification du répertoire:', error)
        return false
    }
}

/**
 * Upload une image secondaire ou studio dans un répertoire existant avec la casse exacte
 * 
 * @param imageFile - Le fichier image à uploader
 * @param folderName - Nom du répertoire avec la casse exacte (ex: "Jean Dupont")
 * @param fileName - Nom du fichier (ex: "Jean Dupont_2" ou "Jean Dupont_studio")
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
        // Étape 1: Authentification Firebase côté client
        const { getAuth, signInAnonymously } = await import('firebase/auth')
        const { app } = await import('./config')

        const auth = getAuth(app)
        await signInAnonymously(auth)

        // Note: La vérification du répertoire doit être faite avant d'appeler cette fonction
        // Cette fonction assume que le répertoire existe déjà

        // Étape 2: Conversion WebP
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

        // Étape 3: Upload vers Firebase dans le répertoire existant
        onUploadStatus?.('in-progress')
        const folderPath = `artists/${folderName}`
        const fileExtension = 'webp'
        const storagePath = `${folderPath}/${fileName}.${fileExtension}`
        const storageRef = ref(storage, storagePath)

        await uploadBytes(storageRef, conversionResult.file)
        const imageUrl = await getDownloadURL(storageRef)

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
 * Supprime une image de Firebase Storage
 * 
 * @param imageUrl - URL de l'image à supprimer
 * @returns Promise<boolean> - true si la suppression a réussi, false sinon
 */
export async function deleteImageFromFirebase(imageUrl: string): Promise<boolean> {
    try {
        // Extraire le chemin de stockage à partir de l'URL
        const storagePath = extractFirebaseStoragePath(imageUrl);

        if (!storagePath) {
            console.error('Impossible d\'extraire le chemin de stockage:', imageUrl);
            return false;
        }

        console.log(`Tentative de suppression de l'image: ${storagePath}`);

        // Créer une référence à l'image
        const imageRef = ref(storage, storagePath);

        // Supprimer l'image
        await deleteObject(imageRef);

        console.log(`Image supprimée avec succès: ${storagePath}`);
        return true;
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'image:', error);
        return false;
    }
} 