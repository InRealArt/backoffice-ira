'use server'

import { revalidatePath } from 'next/cache'
import { generateNFTMetadata } from '@/lib/nft-templates/generateMetadata'

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
        imageFormData.append("network", "public")
        // Options pour rendre le fichier public
        imageFormData.append('pinataOptions', JSON.stringify({
            cidVersion: 1,
            wrapWithDirectory: false
        }))
        imageFormData.append('pinataMetadata', JSON.stringify({
            name: `${productTitle || 'nft'}_image`
        }))

        // Upload du certificat sur IPFS
        const certificateFormData = new FormData()
        certificateFormData.append('file', certificateFile)
        certificateFormData.append('name', `${productTitle || 'nft'}_certificate`)
        certificateFormData.append("network", "public")

        // Options pour rendre le fichier public
        certificateFormData.append('pinataOptions', JSON.stringify({
            cidVersion: 1,
            wrapWithDirectory: false
        }))
        certificateFormData.append('pinataMetadata', JSON.stringify({
            name: `${productTitle || 'nft'}_certificate`
        }))

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

/**
 * Upload des métadonnées NFT sur IPFS
 */
export async function uploadMetadataToIpfs(params: {
    name: string;
    description: string;
    imageCID: string;
    certificateUri: string;
    externalUrl?: string;
}) {
    try {
        const nftMetadata = generateNFTMetadata(params);

        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PINATA_JWT}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pinataOptions: {
                    cidVersion: 1
                },
                pinataMetadata: {
                    name: `${params.name.replace(/\s+/g, '_').toLowerCase()}_metadata.json`
                },
                pinataContent: nftMetadata
            })
        };

        const metadataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', options);

        if (!metadataResponse.ok) {
            const errorData = await metadataResponse.json();
            console.error('Erreur détaillée Pinata:', errorData);
            return {
                success: false,
                error: `Erreur API Pinata: ${JSON.stringify(errorData)}`
            };
        }

        const metadataData = await metadataResponse.json();

        return {
            success: true,
            metadata: {
                data: {
                    cid: metadataData.IpfsHash
                }
            }
        };
    } catch (error: any) {
        console.error('Erreur lors de l\'upload des métadonnées:', error);
        return {
            success: false,
            error: error.message || 'Une erreur est survenue lors de l\'upload des métadonnées'
        };
    }
} 