'use server';

import { prisma } from '@/lib/prisma';
import { NotificationStatus } from '@prisma/client';
import { createAdminRestApiClient } from '@shopify/admin-api-client'

type CreateCollectionResult = {
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