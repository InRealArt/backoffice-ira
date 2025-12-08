"use client"

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
        console.log('🔍 [extractFirebaseStoragePath] Extraction du chemin depuis:', url);

        // Les URLs Firebase Storage contiennent généralement un paramètre token
        // Format: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?alt=media&token=TOKEN
        // Le PATH peut être encodé (ex: artists%2FJean%20Dupont%2Fmarketplace%2Fclose_up%2F...)

        // Essayer plusieurs patterns pour être plus robuste
        let match = url.match(/firebasestorage\.googleapis\.com\/v0\/b\/[^\/]+\/o\/([^?]+)/);

        if (!match) {
            // Essayer un autre format possible
            match = url.match(/\/o\/([^?]+)/);
        }

        if (!match) {
            // Essayer avec le format gs://
            if (url.startsWith('gs://')) {
                const gsMatch = url.match(/gs:\/\/[^\/]+\/(.+)/);
                if (gsMatch && gsMatch[1]) {
                    const decodedPath = decodeURIComponent(gsMatch[1]);
                    console.log('✅ [extractFirebaseStoragePath] Chemin extrait (gs://):', decodedPath);
                    return decodedPath;
                }
            }
        }

        if (match && match[1]) {
            // Décoder l'URL (Firebase encode les '/' en '%2F' et les espaces en '%20')
            // Essayer de décoder plusieurs fois au cas où il y aurait un double encodage
            let decodedPath = match[1];
            try {
                decodedPath = decodeURIComponent(decodedPath);
                // Si le décodage a fonctionné mais qu'il y a encore des %2F, essayer une deuxième fois
                if (decodedPath.includes('%2F') || decodedPath.includes('%20')) {
                    decodedPath = decodeURIComponent(decodedPath);
                }
            } catch (decodeError) {
                // Si le décodage échoue, utiliser le chemin tel quel
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
        const { name, surname, imageType = 'profile', normalizeFolderName = false } = options

        // Créer le nom du répertoire
        // Si normalizeFolderName est false, on préserve la casse exacte et tous les caractères (y compris les cédilles comme "ç")
        const folderName = normalizeFolderName
            ? normalizeString(`${name} ${surname}`)
            : `${name} ${surname}`.trim()

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
 * 
 * @param folderPath - Chemin du répertoire (ex: "artists/Jean Dupont")
 * @returns Promise<boolean> - true si le répertoire existe, false sinon
 */
export async function checkFolderExists(folderPath: string): Promise<boolean> {
    try {
        const folderRef = ref(storage, folderPath)
        await listAll(folderRef)
        return true
    } catch (error: any) {
        // Si on ne peut pas lister le dossier, il n'existe pas
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
        console.log('🗑️ [deleteImageFromFirebase] Début de la suppression pour:', imageUrl);

        // Étape 1: Authentification Firebase côté client
        const { getAuth, signInAnonymously } = await import('firebase/auth')
        const { app } = await import('./config')

        const auth = getAuth(app)
        console.log('🔐 [deleteImageFromFirebase] Authentification Firebase...');
        await signInAnonymously(auth)
        console.log('✅ [deleteImageFromFirebase] Authentification réussie');

        // Étape 2: Extraire le chemin de stockage à partir de l'URL
        const storagePath = extractFirebaseStoragePath(imageUrl);

        if (!storagePath) {
            console.error('❌ [deleteImageFromFirebase] Impossible d\'extraire le chemin de stockage depuis:', imageUrl);
            console.error('❌ [deleteImageFromFirebase] Format d\'URL attendu: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?alt=media&token=TOKEN');
            return false;
        }

        console.log(`📁 [deleteImageFromFirebase] Chemin de stockage extrait: ${storagePath}`);

        // Étape 3: Créer une référence à l'image
        const imageRef = ref(storage, storagePath);
        console.log('📎 [deleteImageFromFirebase] Référence créée');

        // Étape 4: Supprimer l'image
        console.log('🗑️ [deleteImageFromFirebase] Tentative de suppression...');
        await deleteObject(imageRef);

        console.log(`✅ [deleteImageFromFirebase] Image supprimée avec succès: ${storagePath}`);
        return true;
    } catch (error: any) {
        // Si le fichier n'existe pas (erreur 404), on considère que c'est OK
        if (error?.code === 'storage/object-not-found') {
            console.log(`ℹ️ [deleteImageFromFirebase] Le fichier n'existe pas (déjà supprimé ou jamais créé): ${imageUrl}`)
            return true
        }

        // Log détaillé de l'erreur
        console.error('❌ [deleteImageFromFirebase] Erreur lors de la suppression de l\'image:', error);
        console.error('❌ [deleteImageFromFirebase] Code d\'erreur:', error?.code);
        console.error('❌ [deleteImageFromFirebase] Message d\'erreur:', error?.message);
        console.error('❌ [deleteImageFromFirebase] Stack:', error?.stack);

        return false;
    }
}

/**
 * Supprime le fichier WebP d'un presaleArtwork depuis Firebase Storage
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
        // Authentification Firebase côté serveur
        const { getAuth, signInAnonymously } = await import('firebase/auth')
        const { app } = await import('./config')

        const auth = getAuth(app)
        await signInAnonymously(auth)

        // Construire le nom du répertoire avec la casse exacte (comme dans PresaleArtworkForm)
        // Le folderName est construit comme `${name} ${surname}` sans normalisation
        const folderName = `${artistName} ${artistSurname}`.trim()

        // Normaliser le nom de l'œuvre (comme dans PresaleArtworkForm)
        const normalizedArtworkName = normalizeString(artworkName)

        // Construire le chemin complet
        const storagePath = `artists/${folderName}/landing/${normalizedArtworkName}.webp`

        console.log(`Tentative de suppression du fichier presaleArtwork: ${storagePath}`)

        // Créer une référence au fichier
        const fileRef = ref(storage, storagePath)

        // Supprimer le fichier
        await deleteObject(fileRef)

        console.log(`Fichier presaleArtwork supprimé avec succès: ${storagePath}`)
        return true
    } catch (error: any) {
        // Si le fichier n'existe pas (erreur 404), on considère que c'est OK
        if (error?.code === 'storage/object-not-found') {
            const storagePath = `artists/${artistName} ${artistSurname}/landing/${normalizeString(artworkName)}.webp`
            console.log(`Le fichier n'existe pas (déjà supprimé ou jamais créé): ${storagePath}`)
            return true
        }
        console.error('Erreur lors de la suppression du fichier presaleArtwork:', error)
        return false
    }
}

/**
 * Vérifie si un répertoire existe dans Firebase Storage et le crée si nécessaire
 * Dans Firebase Storage, les répertoires n'existent pas vraiment - ils sont créés automatiquement
 * lors de l'upload d'un fichier. Cette fonction vérifie l'existence en listant le contenu.
 * 
 * @param folderPath - Chemin du répertoire (ex: "artists/Jean Dupont/landing")
 * @param name - Prénom de l'artiste
 * @param surname - Nom de l'artiste
 * @returns Promise<boolean> - true si le répertoire existe ou a été créé, false en cas d'erreur
 */
export async function ensureFolderExists(
    folderPath: string,
    name: string,
    surname: string
): Promise<boolean> {
    try {
        // Authentification Firebase côté client
        const { getAuth, signInAnonymously } = await import('firebase/auth')
        const { app } = await import('./config')

        const auth = getAuth(app)
        await signInAnonymously(auth)

        // Essayer de lister le contenu du répertoire
        const folderRef = ref(storage, folderPath)

        try {
            const result = await listAll(folderRef)
            // Si on peut lister le dossier, il existe
            console.log(`✓ Répertoire "${folderPath}" existe déjà (${result.items.length} fichier(s))`)
            return true
        } catch (listError: any) {
            // Si le répertoire n'existe pas, on le "crée" en uploadant un fichier placeholder
            // Note: Firebase Storage crée automatiquement les répertoires lors de l'upload
            console.log(`📁 Création du répertoire "${folderPath}"...`)

            // Créer un fichier texte minimal pour créer le répertoire
            const placeholderContent = new Blob([''], { type: 'text/plain' })
            const placeholderFile = new File([placeholderContent], '.placeholder', { type: 'text/plain' })
            const placeholderPath = `${folderPath}/.placeholder`
            const placeholderRef = ref(storage, placeholderPath)

            try {
                await uploadBytes(placeholderRef, placeholderFile)
                console.log(`✓ Répertoire "${folderPath}" créé avec succès`)
                return true
            } catch (uploadError: any) {
                console.error(`❌ Erreur lors de la création du répertoire "${folderPath}":`, uploadError)
                return false
            }
        }
    } catch (error: any) {
        console.error('Erreur lors de la vérification/création du répertoire:', error)
        return false
    }
}

/**
 * Upload une image vers Firebase Storage dans le répertoire landing d'un artiste
 * 
 * @param imageFile - Le fichier image à uploader
 * @param folderName - Nom du répertoire avec la casse exacte (ex: "Jean Dupont")
 * @param fileName - Nom du fichier (sans extension)
 * @param onConversionStatus - Callback pour le statut de conversion
 * @param onUploadStatus - Callback pour le statut d'upload
 * @returns URL de l'image uploadée
 */
export async function uploadImageToLandingFolder(
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

        // Étape 3: Upload vers Firebase dans le répertoire landing
        onUploadStatus?.('in-progress')
        const folderPath = `artists/${folderName}/landing`
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
 * Upload une image vers Firebase Storage dans le répertoire marketplace d'un artiste
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
        // Étape 1: Authentification Firebase côté client
        const { getAuth, signInAnonymously } = await import('firebase/auth')
        const { app } = await import('./config')

        const auth = getAuth(app)
        await signInAnonymously(auth)

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

        // Étape 3: Upload vers Firebase dans le répertoire marketplace
        onUploadStatus?.('in-progress')
        const folderPath = `artists/${folderName}/marketplace`
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
 * Upload une image vers Firebase Storage dans le répertoire marketplace d'un artiste selon le type d'image
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
        // Étape 1: Authentification Firebase côté client
        const { getAuth, signInAnonymously } = await import('firebase/auth')
        const { app } = await import('./config')

        const auth = getAuth(app)
        await signInAnonymously(auth)

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

        // Étape 3: Convertir le type d'image en nom de répertoire (CLOSE_UP -> close_up)
        const typeFolderName = imageType.toLowerCase()

        // Étape 4: Vérifier/créer le répertoire si nécessaire
        const folderPath = `artists/${folderName}/marketplace/${typeFolderName}`
        const nameParts = folderName.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        await ensureFolderExists(folderPath, firstName, lastName)

        // Étape 5: Upload vers Firebase dans le répertoire spécifique au type
        onUploadStatus?.('in-progress')
        const fileExtension = 'webp'
        const timestamp = Date.now()
        const storagePath = `${folderPath}/${fileName}-${timestamp}.${fileExtension}`
        const storageRef = ref(storage, storagePath)

        await uploadBytes(storageRef, conversionResult.file)
        const imageUrl = await getDownloadURL(storageRef)

        onUploadStatus?.('completed')

        return imageUrl
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image par type:", error)
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
 * Upload une image de mockup vers Firebase Storage dans le répertoire /artists/{Prenom Nom}/mockups
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
        // Étape 1: Authentification Firebase côté client
        const { getAuth, signInAnonymously } = await import('firebase/auth')
        const { app } = await import('./config')

        const auth = getAuth(app)
        await signInAnonymously(auth)

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

        // Étape 3: Préparation du chemin de stockage
        // Créer le nom du répertoire avec la casse exacte (Prenom Nom)
        const folderName = `${name} ${surname}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
            .replace(/[^a-zA-Z0-9\s]+/g, '') // Supprime les caractères spéciaux sauf espaces
            .trim()

        // Nom du fichier (avec timestamp si non fourni)
        const finalFileName = fileName || `mockup-${Date.now()}`
        const fileExtension = 'webp'
        const storagePath = `artists/${folderName}/mockups/${finalFileName}.${fileExtension}`

        // Étape 4: Upload vers Firebase
        onUploadStatus?.('in-progress')
        const storageRef = ref(storage, storagePath)

        await uploadBytes(storageRef, conversionResult.file)
        const imageUrl = await getDownloadURL(storageRef)

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