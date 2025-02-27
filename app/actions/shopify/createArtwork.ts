'use server'

import { createAdminRestApiClient } from '@shopify/admin-api-client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'

type CreateArtworkResult = {
    success: boolean
    message: string
    productId?: string
}

export async function createArtwork(formData: FormData): Promise<CreateArtworkResult> {
    try {
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const price = formData.get('price') as string
        const artist = formData.get('artist') as string
        const medium = formData.get('medium') as string
        const dimensions = formData.get('dimensions') as string
        const year = formData.get('year') as string || ''
        const edition = formData.get('edition') as string || ''
        const tagsString = formData.get('tags') as string || ''
        const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : []

        // Validation des champs obligatoires
        if (!title || !description || !price || !artist || !medium || !dimensions) {
            return {
                success: false,
                message: 'Veuillez remplir tous les champs obligatoires'
            }
        }

        // Construction du titre complet pour le produit
        const productTitle = title

        // Construction d'une description complète
        let fullDescription = description + '\n\n'
        fullDescription += `Artiste: ${artist}\n`
        fullDescription += `Support: ${medium}\n`
        fullDescription += `Dimensions: ${dimensions} cm\n`

        if (year) {
            fullDescription += `Année: ${year}\n`
        }

        if (edition) {
            fullDescription += `Édition: ${edition}\n`
        }

        // Initialisation du client Shopify Admin API
        const client = createAdminRestApiClient({
            storeDomain: process.env.SHOPIFY_STORE_NAME || '',
            apiVersion: '2025-01',
            accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '',
        })

        // Extraire l'identifiant de collection de l'artiste (à implémenter)
        const artistCollectionId = await getArtistCollectionId(artist)

        // Créer le produit
        const productResponse = await client.post('products', {
            data: {
                product: {
                    title: productTitle,
                    body_html: fullDescription,
                    vendor: artist,
                    product_type: 'Artwork',
                    tags: [...tags, 'art', 'artwork', medium.toLowerCase()],
                    status: 'active',
                    variants: [
                        {
                            price: price,
                            inventory_management: 'shopify',
                            inventory_quantity: 1,
                            requires_shipping: true
                        }
                    ],
                    options: [
                        {
                            name: 'Size',
                            values: [dimensions]
                        }
                    ],
                    metafields: [
                        {
                            namespace: 'artwork',
                            key: 'artist',
                            value: artist,
                            type: 'string'
                        },
                        {
                            namespace: 'artwork',
                            key: 'medium',
                            value: medium,
                            type: 'string'
                        },
                        {
                            namespace: 'artwork',
                            key: 'dimensions',
                            value: dimensions,
                            type: 'string'
                        },
                        {
                            namespace: 'artwork',
                            key: 'year',
                            value: year,
                            type: 'string'
                        },
                        {
                            namespace: 'artwork',
                            key: 'edition',
                            value: edition,
                            type: 'string'
                        }
                    ],
                }
            }
        })

        if (!productResponse.ok) {
            const errorText = await productResponse.text()
            console.error('Erreur Shopify API lors de la création du produit:', errorText)
            return {
                success: false,
                message: `Erreur API Shopify: ${productResponse.status}`
            }
        }

        const productData = await productResponse.json()
        const productId = productData.product.id

        // Si une collection d'artiste existe, ajouter le produit à cette collection
        if (artistCollectionId) {
            await addProductToCollection(client, productId, artistCollectionId)
        }

        // Traitement des images
        const imageFiles = []
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('image-') && value instanceof File) {
                imageFiles.push(value)
            }
        }

        if (imageFiles.length > 0) {
            // Téléchargement des images
            for (const imageFile of imageFiles) {
                await uploadProductImage(client, productId, imageFile)
            }
        }

        // Rafraîchir la page après création
        revalidatePath('/shopify/create')
        revalidatePath('/shopify/collection')

        return {
            success: true,
            message: `L'œuvre "${title}" a été créée avec succès!`,
            productId
        }

    } catch (error) {
        console.error('Erreur serveur lors de la création de l\'œuvre:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la création de l\'œuvre'
        }
    }
}

// Fonction pour récupérer l'ID de collection de l'artiste
async function getArtistCollectionId(artistName: string): Promise<string | null> {
    try {
        // Recherche de la collection par nom d'artiste
        const client = createAdminRestApiClient({
            storeDomain: process.env.SHOPIFY_STORE_NAME || '',
            apiVersion: '2025-01',
            accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '',
        })

        const response = await client.get(`custom_collections?title=${encodeURIComponent(artistName)}`)

        if (!response.ok) {
            console.error('Erreur lors de la recherche de collection:', await response.text())
            return null
        }

        const data = await response.json()

        if (data.custom_collections.length > 0) {
            return data.custom_collections[0].id
        }

        return null
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'ID de collection:', error)
        return null
    }
}

// Fonction pour ajouter un produit à une collection
async function addProductToCollection(
    client: ReturnType<typeof createAdminRestApiClient>,
    productId: string,
    collectionId: string
) {
    try {
        const response = await client.post('collects', {
            data: {
                collect: {
                    product_id: productId,
                    collection_id: collectionId
                }
            }
        })

        if (!response.ok) {
            console.error('Erreur lors de l\'ajout du produit à la collection:', await response.text())
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout du produit à la collection:', error)
    }
}

// Fonction pour télécharger une image de produit
async function uploadProductImage(
    client: ReturnType<typeof createAdminRestApiClient>,
    productId: string,
    imageFile: File
) {
    try {
        // Conversion du fichier en base64
        const buffer = await imageFile.arrayBuffer()
        const base64Image = Buffer.from(buffer).toString('base64')

        const response = await client.post(`products/${productId}/images`, {
            data: {
                image: {
                    attachment: base64Image,
                    filename: imageFile.name
                }
            }
        })

        if (!response.ok) {
            console.error('Erreur lors du téléchargement de l\'image:', await response.text())
        }
    } catch (error) {
        console.error('Erreur lors du téléchargement de l\'image:', error)
    }
}