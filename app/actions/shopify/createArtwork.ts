'use server'

import { createAdminRestApiClient } from '@shopify/admin-api-client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'

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

        // Validation du prix
        const priceValue = parseFloat(price.replace(',', '.'))
        if (isNaN(priceValue) || priceValue <= 0) {
            return {
                success: false,
                message: 'Le prix doit être un nombre positif'
            }
        }

        // Collecter les images
        const images = []
        for (let pair of formData.entries()) {
            if (pair[0].startsWith('image-') && pair[1] instanceof File) {
                images.push(pair[1] as File)
            }
        }

        if (images.length === 0) {
            return {
                success: false,
                message: 'Au moins une image est requise'
            }
        }

        // Initialiser le client Shopify
        const client = createAdminRestApiClient({
            storeDomain: process.env.SHOPIFY_STORE_NAME || '',
            apiVersion: '2025-01',
            accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '',
        })

        // Construire les métadonnées pour l'œuvre
        const metafields = [
            {
                key: 'artist',
                value: artist,
                type: 'single_line_text_field',
                namespace: 'artwork',
            },
            {
                key: 'medium',
                value: medium,
                type: 'single_line_text_field',
                namespace: 'artwork',
            },
            {
                key: 'dimensions',
                value: dimensions,
                type: 'single_line_text_field',
                namespace: 'artwork',
            }
        ]

        if (year) {
            metafields.push({
                key: 'year',
                value: year,
                type: 'single_line_text_field',
                namespace: 'artwork',
            })
        }

        if (edition) {
            metafields.push({
                key: 'edition',
                value: edition,
                type: 'single_line_text_field',
                namespace: 'artwork',
            })
        }

        // Préparer les images pour envoi à Shopify (encodage Base64)
        const imageUrls = []
        for (const image of images) {
            const buffer = Buffer.from(await image.arrayBuffer())
            imageUrls.push({
                attachment: buffer.toString('base64')
            })
        }

        // Créer le produit sur Shopify
        const productResponse = await client.post('products', {
            data: {
                product: {
                    title,
                    body_html: description,
                    vendor: artist,
                    product_type: 'Artwork',
                    tags: tags,
                    status: 'active',
                    images: imageUrls,
                    variants: [
                        {
                            price: priceValue.toString(),
                            inventory_management: 'shopify',
                            inventory_quantity: 1,
                            inventory_policy: 'deny',
                            requires_shipping: true
                        }
                    ],
                    metafields
                }
            }
        })

        if (!productResponse.ok) {
            const errorText = await productResponse.text()
            console.error('Erreur lors de la création du produit Shopify:', errorText)
            return {
                success: false,
                message: `Erreur Shopify: ${productResponse.status}`
            }
        }

        const productData = await productResponse.json()
        const productId = productData.product.id

        // Traitement des images
        if (images.length > 0) {
            // Téléchargement des images
            for (const image of images) {
                await uploadProductImage(client, productId, image)
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