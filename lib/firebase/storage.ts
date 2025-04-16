import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
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
        const artistPath = options.artistFolder ? `${normalizeString(options.artistFolder)}` : 'unknown-artist'
        const itemPath = options.itemSlug ? `${normalizeString(options.itemSlug)}` : 'unknown-item'

        // Déterminer le préfixe du nom de fichier selon qu'il s'agit de l'image principale ou non
        const filePrefix = options.isMain ? 'main' : `img-${Date.now()}`

        // Chemin complet
        const storagePath = `marketplace/${artistPath}/${itemPath}/${filePrefix}-${normalizedFileName}`

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
        const uploadPromises = files.map((file, index) =>
            uploadImageToFirebase(file, {
                ...options,
                isMain: index === 0 && options.isMain !== false
            })
        )

        // Exécuter tous les uploads en parallèle
        const urls = await Promise.all(uploadPromises)
        return urls
    } catch (error) {
        console.error('Erreur lors de l\'upload multiple d\'images vers Firebase:', error)
        throw new Error(`Échec de l'upload multiple vers Firebase: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
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