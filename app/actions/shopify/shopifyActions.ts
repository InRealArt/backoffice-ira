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

export async function updateNotificationStatus(
  notificationId: number, 
  status: NotificationStatus
) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { 
        status,
        complete: true 
      }
    })
    
    return { success: true }
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du statut à ${status}:`, error)
    throw error
  }
}


export async function createShopifyCollection(collectionName: string): Promise<CreateCollectionResult> {
  try {
    if (!collectionName || collectionName.trim() === '') {
      return {
        success: false,
        message: 'Le nom de la collection est requis'
      }
    }

    // Initialisation du client Shopify Admin API (côté serveur)
    const client = createAdminRestApiClient({
      storeDomain: 'inrealart-marketplace.myshopify.com',
      apiVersion: '2023-10',
      accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '',
    })
    
    // Requête POST pour créer une nouvelle collection
    const response = await client.post('custom_collections', {
      data: {
        custom_collection: {
          title: collectionName,
          published: true,
          sort_order: 'best-selling'
        }
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erreur Shopify API:', errorText)
      return {
        success: false,
        message: `Erreur API Shopify: ${response.status}`
      }
    }
    
    const data = await response.json()
    
    return { 
      success: true,
      message: `Collection "${collectionName}" créée avec succès!`,
      collection: data.custom_collection 
    }
  } catch (error: any) {
    console.error('Erreur serveur:', error)
    return {
      success: false,
      message: error.message || 'Une erreur est survenue lors de la création de la collection'
    }
  }
}

