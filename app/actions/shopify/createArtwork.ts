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

        // Ajouter le produit à la collection de l'artiste
        try {
            // Obtenir l'ID de collection de l'artiste
            const collectionId = await getArtistCollectionId(artist)

            if (collectionId) {
                // Conversion de l'ID numérique au format GID
                const formattedProductId = `gid://shopify/Product/${productId}`
                const formattedCollectionId = `gid://shopify/Collection/${collectionId}`

                // Ajouter le produit à la collection via l'API GraphQL
                await addProductToCollectionGraphQL(formattedCollectionId, [formattedProductId])
                console.log(`Produit ${productId} ajouté à la collection ${collectionId} de l'artiste ${artist}`)
            } else {
                console.log(`Aucune collection trouvée pour l'artiste ${artist}`)
                // Créer une collection pour l'artiste s'il n'en a pas
                const newCollectionId = await createArtistCollection(artist)
                if (newCollectionId) {
                    const formattedProductId = `gid://shopify/Product/${productId}`
                    const formattedCollectionId = `gid://shopify/Collection/${newCollectionId}`
                    await addProductToCollectionGraphQL(formattedCollectionId, [formattedProductId])
                }
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout du produit à la collection de l\'artiste:', error)
            // Ne pas échouer la création du produit si l'ajout à la collection échoue
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

// Fonction pour ajouter un produit à une collection via GraphQL
async function addProductToCollectionGraphQL(collectionId: string, productIds: string[]) {
    try {
        // Client Admin avec token d'authentification
        const adminAccessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '';
        const storeDomain = process.env.SHOPIFY_STORE_NAME || '';
        const apiVersion = '2025-01';

        const mutation = `
            mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
                collectionAddProducts(id: $id, productIds: $productIds) {
                    collection {
                        id
                        title
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const variables = {
            id: collectionId,
            productIds: productIds
        };

        const response = await fetch(
            `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': adminAccessToken
                },
                body: JSON.stringify({
                    query: mutation,
                    variables
                })
            }
        );

        const data = await response.json();

        if (data.errors || (data.data && data.data.collectionAddProducts && data.data.collectionAddProducts.userErrors.length > 0)) {
            console.error('Erreur GraphQL:', data.errors || data.data.collectionAddProducts.userErrors);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Erreur lors de l\'ajout du produit via GraphQL:', error);
        return false;
    }
}

// Fonction pour créer une collection pour un artiste
async function createArtistCollection(artistName: string): Promise<string | null> {
    try {
        const client = createAdminRestApiClient({
            storeDomain: process.env.SHOPIFY_STORE_NAME || '',
            apiVersion: '2025-01',
            accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '',
        })

        const response = await client.post('custom_collections', {
            data: {
                custom_collection: {
                    title: artistName,
                    published: true
                }
            }
        })

        if (!response.ok) {
            console.error('Erreur lors de la création de la collection:', await response.text())
            return null
        }

        const data = await response.json()
        return data.custom_collection.id
    } catch (error) {
        console.error('Erreur lors de la création de la collection:', error)
        return null
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