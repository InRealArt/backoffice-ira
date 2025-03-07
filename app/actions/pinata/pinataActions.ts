'use server'

import { revalidatePath } from 'next/cache'

const PINATA_JWT = process.env.PINATA_JWT

export async function uploadFilesToIpfs(imageFile: File, certificateFile: File, productTitle: string) {
    try {
        // Vérifier si le JWT est configuré
        if (!PINATA_JWT) {
            throw new Error('Configuration Pinata manquante')
        }

        // Upload de l'image sur IPFS
        const imageFormData = new FormData()
        imageFormData.append('file', imageFile)
        imageFormData.append('name', `${productTitle || 'nft'}_image`)

        // Upload du certificat sur IPFS
        const certificateFormData = new FormData()
        certificateFormData.append('file', certificateFile)
        certificateFormData.append('name', `${productTitle || 'nft'}_certificate`)

        // Appel parallèle des deux uploads directement à l'API Pinata
        const [imageResponse, certificateResponse] = await Promise.all([
            fetch('https://uploads.pinata.cloud/v3/files', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${PINATA_JWT}`,
                },
                body: imageFormData,
            }),
            fetch('https://uploads.pinata.cloud/v3/files', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${PINATA_JWT}`,
                },
                body: certificateFormData,
            })
        ])

        // Vérifier si les requêtes ont réussi
        if (!imageResponse.ok || !certificateResponse.ok) {
            const imageError = imageResponse.ok ? null : await imageResponse.json().catch(() => null)
            const certError = certificateResponse.ok ? null : await certificateResponse.json().catch(() => null)

            console.error('Erreur upload image:', imageError)
            console.error('Erreur upload certificat:', certError)

            throw new Error('Erreur lors de l\'upload sur IPFS')
        }

        // Récupérer les réponses
        const imageData = await imageResponse.json()
        const certificateData = await certificateResponse.json()

        // Retourner les CIDs et autres informations utiles
        return {
            success: true,
            image: imageData,
            certificate: certificateData
        }
    } catch (error) {
        console.error('Erreur lors de l\'upload sur IPFS:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
        }
    }
} 