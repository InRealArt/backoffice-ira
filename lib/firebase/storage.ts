import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './config'
import { normalizeString } from '@/lib/utils'

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