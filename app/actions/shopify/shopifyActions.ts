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
    title?: string
    description?: string
    isPublished?: boolean
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

    if (data.title !== undefined) {
      updateData.title = data.title
    }

    if (data.description !== undefined) {
      updateData.body_html = data.description
    }

    if (data.isPublished !== undefined) {
      updateData.published = data.isPublished
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