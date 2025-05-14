'use server';

import { prisma } from '@/lib/prisma';
import { createAdminRestApiClient } from '@shopify/admin-api-client'
import { revalidatePath } from 'next/cache'
import { getItemById } from './prisma-actions';
import { HeartIcon } from 'lucide-react';

type CreateCollectionResult = {
  success: boolean
  message: string
  collection?: any
}

type GetCollectionResult = {
  success: boolean
  message: string
  collection?: any
}

type UpdateCollectionResult = {
  success: boolean
  message: string
  collection?: any
}

type GetCollectionProductsResult = {
  success: boolean
  message: string
  products?: any[]
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  walletAddress: string;
}

type CreateArtworkResult = {
  success: boolean
  message: string
  productId?: string
}


export async function getUserByEmail(email: string) {
  try {
    if (!email) {
      throw new Error('Email requis');
    }

    const user = await prisma.backofficeUser.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return { success: true, user };
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    throw error;
  }
}

// Action pour créer une collection Shopify et la publier sur tous les canaux
export async function createShopifyCollection(
  collectionName: string
): Promise<CreateCollectionResult> {
  try {
    if (!collectionName || collectionName.trim() === '') {
      return {
        success: false,
        message: 'Le nom de la collection est requis'
      }
    }

    // Initialisation du client Shopify Admin API
    const client = createAdminRestApiClient({
      storeDomain: process.env.SHOPIFY_STORE_NAME || '',
      apiVersion: '2025-01',
      accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '',
    })

    // 1. Créer la collection
    const collectionResponse = await client.post('custom_collections', {
      data: {
        custom_collection: {
          title: collectionName,
          published: true,
          sort_order: 'best-selling'
        }
      }
    })

    if (!collectionResponse.ok) {
      const errorText = await collectionResponse.text()
      console.error('Erreur Shopify API lors de la création de la collection:', errorText)
      return {
        success: false,
        message: `Erreur API Shopify: ${collectionResponse.status}`
      }
    }

    const collectionData = await collectionResponse.json()
    const collectionId = collectionData.custom_collection.id


    return {
      success: true,
      message: `Collection "${collectionName}" créée et publiée sur tous les canaux avec succès!`,
      collection: collectionData.custom_collection
    }
  } catch (error: any) {
    console.error('Erreur serveur lors de la création/publication de collection:', error)
    return {
      success: false,
      message: error.message || 'Une erreur est survenue lors de la création de la collection'
    }
  }
}

// Action pour récupérer une collection Shopify par son titre
export async function getShopifyCollectionByTitle(
  title: string
): Promise<GetCollectionResult> {
  try {
    if (!title || title.trim() === '') {
      return {
        success: false,
        message: 'Le titre de la collection est requis'
      }
    }

    // Initialisation du client Shopify Admin API
    const client = createAdminRestApiClient({
      storeDomain: process.env.SHOPIFY_STORE_NAME || '',
      apiVersion: '2025-01',
      accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '',
    })

    // Récupérer les collections et filtrer par titre
    const collectionsResponse = await client.get('custom_collections')

    if (!collectionsResponse.ok) {
      const errorText = await collectionsResponse.text()
      console.error('Erreur Shopify API lors de la récupération des collections:', errorText)
      return {
        success: false,
        message: `Erreur API Shopify: ${collectionsResponse.status}`
      }
    }

    const collectionsData = await collectionsResponse.json()

    // Chercher la collection avec le titre exact
    const matchingCollection = collectionsData.custom_collections.find(
      (collection: any) => collection.title === title
    )

    if (!matchingCollection) {
      return {
        success: false,
        message: `Aucune collection trouvée avec le titre "${title}"`
      }
    }

    return {
      success: true,
      message: 'Collection trouvée',
      collection: matchingCollection
    }
  } catch (error: any) {
    console.error('Erreur serveur lors de la récupération de la collection:', error)
    return {
      success: false,
      message: error.message || 'Une erreur est survenue lors de la récupération de la collection'
    }
  }
}

// Action pour mettre à jour une collection Shopify existante
export async function updateShopifyCollection(
  collectionId: string,
  data: {
    description?: string
  }
): Promise<UpdateCollectionResult> {
  try {
    if (!collectionId) {
      return {
        success: false,
        message: 'L\'ID de la collection est requis'
      }
    }

    // Initialisation du client Shopify Admin API
    const client = createAdminRestApiClient({
      storeDomain: process.env.SHOPIFY_STORE_NAME || '',
      apiVersion: '2025-01',
      accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '',
    })

    // Préparer les données pour la mise à jour
    const updateData: any = {}


    if (data.description !== undefined) {
      updateData.body_html = data.description
    }

    // Mettre à jour la collection
    const updateResponse = await client.put(`custom_collections/${collectionId}`, {
      data: {
        custom_collection: updateData
      }
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error('Erreur Shopify API lors de la mise à jour de la collection:', errorText)
      return {
        success: false,
        message: `Erreur API Shopify: ${updateResponse.status}`
      }
    }

    const updatedCollection = await updateResponse.json()

    return {
      success: true,
      message: 'Collection mise à jour avec succès',
      collection: updatedCollection.custom_collection
    }
  } catch (error: any) {
    console.error('Erreur serveur lors de la mise à jour de la collection:', error)
    return {
      success: false,
      message: error.message || 'Une erreur est survenue lors de la mise à jour de la collection'
    }
  }
}

// Action pour récupérer tous les produits d'une collection Shopify
export async function getShopifyCollectionProducts(
  collectionId: string
): Promise<GetCollectionProductsResult> {
  try {
    if (!collectionId) {
      return {
        success: false,
        message: 'L\'ID de la collection est requis'
      }
    }

    // Initialisation du client Shopify Admin API
    const client = createAdminRestApiClient({
      storeDomain: process.env.SHOPIFY_STORE_NAME || '',
      apiVersion: '2025-01',
      accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '',
    })

    // Utiliser l'API GraphQL pour obtenir les produits avec plus de détails
    const query = `
      query getCollectionProducts($id: ID!) {
        collection(id: $id) {
          products(first: 50) {
            edges {
              node {
                id
                title
                handle
                description
                priceRangeV2 {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                featuredImage {
                  url
                  altText
                }
                images(first: 1) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    const formattedCollectionId = `gid://shopify/Collection/${collectionId}`

    const response = await fetch(
      `https://${process.env.SHOPIFY_STORE_NAME}/admin/api/2025-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || ''
        },
        body: JSON.stringify({
          query,
          variables: { id: formattedCollectionId }
        })
      }
    )

    const data = await response.json()

    if (data.errors) {
      console.error('Erreur GraphQL:', data.errors)
      return {
        success: false,
        message: 'Erreur lors de la récupération des produits'
      }
    }

    if (!data.data.collection) {
      return {
        success: false,
        message: 'Collection non trouvée'
      }
    }

    // Formatage des données des produits
    const products = data.data.collection.products.edges.map((edge: any) => {
      const product = edge.node

      // Obtenir l'URL de l'image (soit de featuredImage, soit de la première image)
      let imageUrl = null
      let imageAlt = ''

      if (product.featuredImage) {
        imageUrl = product.featuredImage.url
        imageAlt = product.featuredImage.altText || product.title
      } else if (product.images.edges.length > 0) {
        imageUrl = product.images.edges[0].node.url
        imageAlt = product.images.edges[0].node.altText || product.title
      }

      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        description: product.description,
        price: product.priceRangeV2?.minVariantPrice?.amount || '0',
        currency: product.priceRangeV2?.minVariantPrice?.currencyCode || 'EUR',
        imageUrl,
        imageAlt
      }
    })

    return {
      success: true,
      message: 'Produits récupérés avec succès',
      products
    }
  } catch (error: any) {
    console.error('Erreur serveur lors de la récupération des produits:', error)
    return {
      success: false,
      message: error.message || 'Une erreur est survenue lors de la récupération des produits'
    }
  }
}

// Action pour mettre à jour un produit Shopify
export async function updateShopifyProduct(
  productId: string,
  data: { title?: string; description?: string; price?: number }
) {
  try {
    if (!productId) {
      return {
        success: false,
        message: 'ID de produit requis'
      }
    }

    // Initialisation du client Shopify Admin API
    const client = createAdminRestApiClient({
      storeDomain: process.env.SHOPIFY_STORE_NAME || '',
      apiVersion: '2025-01',
      accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '',
    })

    // Récupérer d'abord le produit pour obtenir les informations actuelles
    const productResponse = await client.get(`products/${productId}`)

    const productData = await productResponse.json()

    if (!productData?.product) {
      return {
        success: false,
        message: 'Produit non trouvé'
      }
    }

    const currentProduct = productData.product

    // Préparer les données pour la mise à jour
    const updateData = {
      product: {
        id: productId,
        title: data.title || currentProduct.title,
        body_html: data.description || currentProduct.body_html,
      }
    }

    // Si le prix est fourni, mettre à jour la variante principale
    if (data.price !== undefined && currentProduct.variants && currentProduct.variants.length > 0) {
      const variantId = currentProduct.variants[0].id

      // Mettre à jour la variante séparément
      await client.put(`variants/${variantId}`, {
        data: {
          variant: {
            id: variantId,
            price: data.price.toString()
          }
        }
      })
    }

    // Mettre à jour le produit
    const updateResponse = await client.put(`products/${productId}`, {
      data: updateData
    })

    const updatedProduct = await updateResponse.json()

    return {
      success: true,
      message: 'Produit mis à jour avec succès',
      product: updatedProduct.product
    }
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du produit:', error)
    return {
      success: false,
      message: error.message || 'Une erreur est survenue lors de la mise à jour du produit'
    }
  }
}

// Action pour récupérer un produit Shopify en utilisant l'ID de la table Item
export async function getShopifyProductById(itemId: string) {
  try {
    if (!itemId) {
      return {
        success: false,
        message: 'ID de l\'item requis'
      }
    }

    // Récupérer l'item pour vérifier qu'il existe
    const item = await getItemById(parseInt(itemId))

    if (!item) {
      return {
        success: false,
        message: 'Item non trouvé'
      }
    }

    // Initialisation du client Shopify Admin API
    const client = createAdminRestApiClient({
      storeDomain: process.env.SHOPIFY_STORE_NAME || '',
      apiVersion: '2025-01',
      accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '',
    })

    // Utiliser l'ID de l'item comme identifiant pour Shopify (si la convention est maintenue)
    const shopifyId = itemId

    // Récupérer le produit
    const response = await client.get(`products/${shopifyId}`)

    const productData = await response.json()

    if (!productData?.product) {
      return {
        success: false,
        message: 'Produit non trouvé'
      }
    }

    const product = productData.product

    // Extraire l'URL de l'image si elle existe
    let imageUrl = null
    let imageAlt = ''

    if (product.image) {
      imageUrl = product.image.src
      imageAlt = product.image.alt || product.title
    }

    // Extraire le prix de la première variante
    const price = product.variants && product.variants.length > 0
      ? product.variants[0].price || '0'
      : '0'

    return {
      success: true,
      product: {
        id: product.id,
        title: product.title,
        description: product.body_html,
        price,
        currency: 'EUR', // Par défaut
        imageUrl,
        imageAlt,
        handle: product.handle
      }
    }
  } catch (error: any) {
    console.error('Erreur lors de la récupération du produit:', error)
    return {
      success: false,
      message: error.message || 'Une erreur est survenue lors de la récupération du produit'
    }
  }
}


export async function createArtwork(formData: FormData): Promise<CreateArtworkResult> {
  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const medium = formData.get('medium') as string
    const height = formData.get('height') as string || ''
    const width = formData.get('width') as string || ''
    const year = formData.get('year') as string || ''
    const creationYear = formData.get('creationYear') as string || ''
    const edition = formData.get('edition') as string || ''
    const tagsString = formData.get('tags') as string || ''
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : []
    const userEmail = formData.get('userEmail') as string
    const weight = formData.get('weight') as string || ''

    // Récupérer les options de prix
    const hasPhysicalOnly = formData.get('hasPhysicalOnly') === 'true'
    const hasNftOnly = formData.get('hasNftOnly') === 'true'
    const hasNftPlusPhysical = formData.get('hasNftPlusPhysical') === 'true'

    const pricePhysicalBeforeTax = hasPhysicalOnly ? formData.get('pricePhysicalBeforeTax') as string : ''
    const priceNftBeforeTax = hasNftOnly ? formData.get('priceNftBeforeTax') as string : ''
    const priceNftPlusPhysicalBeforeTax = hasNftPlusPhysical ? formData.get('priceNftPlusPhysicalBeforeTax') as string : ''

    // Récupérer le certificat d'authenticité
    const certificate = formData.get('certificate') as File

    // Validation des champs obligatoires
    if (!title || !description) {
      console.log('title', title)
      console.log('description', description)
      return {
        success: false,
        message: 'Veuillez remplir tous les champs obligatoires'
      }
    }

    // Vérifier qu'au moins une option de prix est sélectionnée
    if (!hasPhysicalOnly && !hasNftOnly && !hasNftPlusPhysical) {
      return {
        success: false,
        message: 'Veuillez sélectionner au moins une option de prix'
      }
    }

    // Vérifier que toutes les options sélectionnées ont un prix valide
    if ((hasPhysicalOnly && (!pricePhysicalBeforeTax || isNaN(parseFloat(pricePhysicalBeforeTax)))) ||
      (hasNftOnly && (!priceNftBeforeTax || isNaN(parseFloat(priceNftBeforeTax)))) ||
      (hasNftPlusPhysical && (!priceNftPlusPhysicalBeforeTax || isNaN(parseFloat(priceNftPlusPhysicalBeforeTax))))) {
      return {
        success: false,
        message: 'Veuillez spécifier un prix valide pour chaque option sélectionnée'
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
        key: 'medium',
        value: medium,
        type: 'single_line_text_field',
        namespace: 'artwork',
      },
      {
        key: 'dimensions',
        value: height + ' x ' + width,
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

    if (creationYear) {
      metafields.push({
        key: 'creationYear',
        value: creationYear,
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

    // Convertir le poids en nombre pour Shopify
    const weightValue = weight ? parseFloat(weight.replace(',', '.')) : 0

    // Préparer les images pour envoi à Shopify (encodage Base64)
    const imageUrls = []
    for (const image of images) {
      const buffer = Buffer.from(await image.arrayBuffer())
      imageUrls.push({
        attachment: buffer.toString('base64')
      })
    }

    // Préparer les variantes du produit en fonction des options sélectionnées
    const variants = []

    if (hasPhysicalOnly) {
      variants.push({
        option1: 'Physical art only',
        price: parseFloat(pricePhysicalBeforeTax).toString(),
        inventory_management: 'shopify',
        inventory_quantity: 1,
        inventory_policy: 'deny',
        requires_shipping: true,
        weight: weightValue,
        weight_unit: 'kg',
      })
    }

    if (hasNftOnly) {
      variants.push({
        option1: 'NFT only',
        price: parseFloat(priceNftBeforeTax).toString(),
        inventory_management: 'shopify',
        inventory_quantity: 1,
        inventory_policy: 'deny',
        requires_shipping: false, // Les NFT ne nécessitent pas d'expédition
        weight: 0,
        weight_unit: 'kg',
      })
    }

    if (hasNftPlusPhysical) {
      variants.push({
        option1: 'NFT + Physical art',
        price: parseFloat(priceNftPlusPhysicalBeforeTax).toString(),
        inventory_management: 'shopify',
        inventory_quantity: 1,
        inventory_policy: 'deny',
        requires_shipping: true,
        weight: weightValue,
        weight_unit: 'kg',
      })
    }

    // Créer le produit sur Shopify avec les variantes
    const productResponse = await client.post('products', {
      data: {
        product: {
          title,
          body_html: description,
          vendor: 'In Real Art', // Utiliser le nom de la plateforme au lieu de l'artiste
          product_type: 'Artwork',
          tags: tags,
          status: 'active',
          images: imageUrls,
          options: [
            {
              name: 'Format', // Le nom de l'option qui définit les variantes
              values: variants.map(v => v.option1) // Les valeurs possibles pour cette option
            }
          ],
          variants: variants,
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

    // Upload du certificat d'authenticité sur shopify
    //===> Impossible de le rattacher à un produit
    // if (certificate && certificate.size > 0) {
    //   console.log('certificate === ', certificate);
    //   try {
    //     await uploadCertificateFile(client, productId, certificate);
    //   } catch (certError) {
    //     console.error('Erreur détaillée lors du téléchargement du certificat:', certError);
    //     // Ne pas bloquer la création du produit si l'upload du certificat échoue
    //   }
    // }

    // Ajouter le produit à la collection de l'utilisateur connecté
    try {
      // Récupérer les informations de l'utilisateur pour construire le titre de la collection
      const userResponse = await getUserByEmail(userEmail)

      if (!userResponse.success || !userResponse.user || !userResponse.user.firstName || !userResponse.user.lastName) {
        throw new Error('Informations utilisateur incomplètes ou utilisateur non trouvé')
      }

      // Construire le titre de la collection avec prénom + nom
      const collectionTitle = `${userResponse.user.firstName} ${userResponse.user.lastName}`.trim()

      // Obtenir la collection correspondante
      const collectionResponse = await getShopifyCollectionByTitle(collectionTitle)

      if (collectionResponse.success && collectionResponse.collection) {
        // Conversion de l'ID numérique au format GID
        const productIdString = String(productId)
        const formattedProductId = productIdString.includes('gid://')
          ? productIdString
          : `gid://shopify/Product/${productIdString}`
        const formattedCollectionId = `gid://shopify/Collection/${collectionResponse.collection.id}`

        // Ajouter le produit à la collection via l'API GraphQL
        await addProductToCollectionGraphQL(formattedCollectionId, [formattedProductId])
        console.log(`Produit ${productId} ajouté à la collection ${collectionResponse.collection.id} de l'utilisateur ${collectionTitle}`)
      } else {
        console.log(`Aucune collection trouvée pour l'utilisateur ${collectionTitle}`)
        // Créer une collection pour l'utilisateur s'il n'en a pas
        const newCollectionId = await createArtistCollection(collectionTitle)
        if (newCollectionId) {
          const formattedProductId = `gid://shopify/Product/${productId}`
          const formattedCollectionId = `gid://shopify/Collection/${newCollectionId}`
          await addProductToCollectionGraphQL(formattedCollectionId, [formattedProductId])
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du produit à la collection de l\'utilisateur:', error)
      // Ne pas échouer la création du produit si l'ajout à la collection échoue
    }

    // Rafraîchir la page après création
    revalidatePath('/art/create')
    revalidatePath('/art/collection')

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

// Fonction pour télécharger un certificat d'authenticité PDF et l'attacher au produit
async function uploadCertificateFile(
  client: ReturnType<typeof createAdminRestApiClient>,
  productId: string,
  certificateFile: File
) {
  try {
    console.log('Démarrage de l\'upload du certificat avec l\'approche en plusieurs étapes');

    // Étape 1: Créer une cible d'upload temporaire
    const adminAccessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '';
    const storeDomain = process.env.SHOPIFY_STORE_NAME || '';
    const apiVersion = '2025-01';

    const stagedUploadsQuery = `
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const stagedUploadVariables = {
      input: [
        {
          filename: certificateFile.name || 'certificate.pdf',
          mimeType: 'application/pdf',
          httpMethod: 'POST',
          resource: 'FILE',
          fileSize: certificateFile.size.toString()
        }
      ]
    };

    console.log('Étape 1: Création de la cible d\'upload temporaire');
    const stagedUploadResponse = await fetch(
      `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminAccessToken
        },
        body: JSON.stringify({
          query: stagedUploadsQuery,
          variables: stagedUploadVariables
        })
      }
    );

    if (!stagedUploadResponse.ok) {
      throw new Error(`Erreur HTTP lors de la création de la cible d'upload: ${stagedUploadResponse.status}`);
    }

    const stagedUploadData = await stagedUploadResponse.json();

    // Vérifier les erreurs dans la réponse GraphQL
    if (stagedUploadData.errors) {
      console.error('Erreurs GraphQL:', stagedUploadData.errors);
      throw new Error(`Erreur GraphQL: ${stagedUploadData.errors[0].message}`);
    }

    // Vérifier les erreurs utilisateur
    if (stagedUploadData.data?.stagedUploadsCreate?.userErrors?.length > 0) {
      console.error('Erreurs utilisateur:', stagedUploadData.data.stagedUploadsCreate.userErrors);
      throw new Error(`Erreur: ${stagedUploadData.data.stagedUploadsCreate.userErrors[0].message}`);
    }

    // Récupérer les données pour l'upload
    const stagedTarget = stagedUploadData.data?.stagedUploadsCreate?.stagedTargets?.[0];
    if (!stagedTarget) {
      throw new Error('Aucune cible d\'upload retournée');
    }

    console.log('Cible d\'upload créée:', stagedTarget.url);
    console.log('ResourceURL:', stagedTarget.resourceUrl);

    // Étape 2: Uploader le fichier vers l'URL temporaire
    const formData = new FormData();
    stagedTarget.parameters.forEach((param: { name: string; value: string }) => {
      formData.append(param.name, param.value);
    });
    formData.append('file', certificateFile);

    console.log('Étape 2: Upload du fichier vers l\'URL temporaire');
    const fileUploadResponse = await fetch(stagedTarget.url, {
      method: 'POST',
      body: formData
    });

    if (!fileUploadResponse.ok) {
      const errorText = await fileUploadResponse.text();
      throw new Error(`Erreur lors de l'upload du fichier: ${fileUploadResponse.status} ${errorText}`);
    }

    console.log('Fichier uploadé avec succès');

    // Étape 3: Créer un asset de fichier
    const fileCreateQuery = `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            fileStatus
            alt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const fileCreateVariables = {
      files: [
        {
          alt: `Certificat d'authenticité pour ${productId}`,
          contentType: 'FILE',
          originalSource: stagedTarget.resourceUrl,
          filename: certificateFile.name || 'certificate.pdf'
        }
      ]
    };

    console.log('Étape 3: Création de l\'asset de fichier');
    const fileCreateResponse = await fetch(
      `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminAccessToken
        },
        body: JSON.stringify({
          query: fileCreateQuery,
          variables: fileCreateVariables
        })
      }
    );

    if (!fileCreateResponse.ok) {
      throw new Error(`Erreur HTTP lors de la création de l'asset: ${fileCreateResponse.status}`);
    }

    const fileCreateData = await fileCreateResponse.json();

    // Vérifier les erreurs
    if (fileCreateData.errors) {
      console.error('Erreurs GraphQL:', fileCreateData.errors);
      throw new Error(`Erreur GraphQL: ${fileCreateData.errors[0].message}`);
    }

    if (fileCreateData.data?.fileCreate?.userErrors?.length > 0) {
      console.error('Erreurs utilisateur:', fileCreateData.data.fileCreate.userErrors);
      throw new Error(`Erreur: ${fileCreateData.data.fileCreate.userErrors[0].message}`);
    }

    // Récupérer l'ID du fichier créé
    const fileAsset = fileCreateData.data?.fileCreate?.files?.[0];
    if (!fileAsset) {
      throw new Error('Aucun asset de fichier créé');
    }

    console.log('Asset de fichier créé:', fileAsset.id);

    // Nouvelle Étape 4: Attacher le fichier au produit avec productUpdate
    const productUpdateQuery = `
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            files {
              id
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Formater correctement l'ID du produit en s'assurant qu'il est d'abord converti en chaîne
    const productIdString = String(productId);
    const formattedProductId = productIdString.includes('gid://')
      ? productIdString
      : `gid://shopify/Product/${productIdString}`;

    const productUpdateVariables = {
      input: {
        id: formattedProductId,
        files: [
          {
            id: fileAsset.id // l'ID est déjà au format GID
          }
        ]
      }
    };

    console.log('Étape 4: Attachement du fichier au produit');
    console.log('Product ID:', formattedProductId);
    console.log('File ID:', fileAsset.id);

    const productUpdateResponse = await fetch(
      `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminAccessToken
        },
        body: JSON.stringify({
          query: productUpdateQuery,
          variables: productUpdateVariables
        })
      }
    );

    if (!productUpdateResponse.ok) {
      throw new Error(`Erreur HTTP lors de la mise à jour du produit: ${productUpdateResponse.status}`);
    }

    const productUpdateData = await productUpdateResponse.json();

    // Vérifier les erreurs
    if (productUpdateData.errors) {
      console.error('Erreurs GraphQL:', productUpdateData.errors);
      throw new Error(`Erreur GraphQL: ${productUpdateData.errors[0].message}`);
    }

    if (productUpdateData.data?.productUpdate?.userErrors?.length > 0) {
      console.error('Erreurs utilisateur:', productUpdateData.data.productUpdate.userErrors);
      throw new Error(`Erreur: ${productUpdateData.data.productUpdate.userErrors[0].message}`);
    }

    console.log('Certificat d\'authenticité attaché au produit avec succès');
    return true;

  } catch (error) {
    console.error('Erreur complète lors de l\'upload du certificat:', error);
    throw error;
  }
}
