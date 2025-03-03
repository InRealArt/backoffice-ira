'use server';

import { prisma } from '@/lib/prisma';
import { NotificationStatus } from '@prisma/client';
import { createAdminRestApiClient } from '@shopify/admin-api-client'

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

export async function getUserByEmail(email: string) {
  try {
    if (!email) {
      throw new Error('Email requis');
    }

    const user = await prisma.shopifyUser.findUnique({
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

// Action pour récupérer un produit Shopify par ID
export async function getShopifyProductById(productId: string) {
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

    // Récupérer le produit
    const response = await client.get(`products/${productId}`)

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