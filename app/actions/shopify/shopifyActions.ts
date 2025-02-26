'use server';

import { prisma } from '@/lib/prisma';

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

export async function createStaffAccount(data: {
  email: string;
  firstName: string;
  lastName: string;
  notificationId: number;
}) {
  try {
    const { email, firstName, lastName, notificationId } = data;
    
    if (!email || !notificationId) {
      throw new Error('Données incomplètes');
    }
    
    // Récupérer les identifiants Shopify depuis les variables d'environnement
    const shopifyStoreUrl = process.env.SHOPIFY_STORE_URL;
    const shopifyAdminApiAccessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

    if (!shopifyStoreUrl || !shopifyAdminApiAccessToken) {
      throw new Error('Configuration Shopify manquante');
    }

    // Construire la requête GraphQL pour créer un compte staff
    const mutation = `
      mutation staffMemberCreate($input: StaffMemberInput!) {
        staffMemberCreate(input: $input) {
          staffMember {
            id
            firstName
            lastName
            email
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Paramètres pour la création du compte staff
    const variables = {
      input: {
        email: email,
        firstName: firstName || "Nouveau",
        lastName: lastName || "Collaborateur",
        permissions: ["applications", "customers", "dashboard", "orders", "products"]
      }
    };

    // Effectuer la requête GraphQL à l'API Admin de Shopify
    const graphqlResponse = await fetch(
      `https://${shopifyStoreUrl}/admin/api/2023-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAdminApiAccessToken
      },
      body: JSON.stringify({
        query: mutation,
        variables: variables
      })
    });

    const graphqlData = await graphqlResponse.json();

    // Vérifier s'il y a des erreurs dans la réponse GraphQL
    if (graphqlData.errors || (graphqlData.data?.staffMemberCreate?.userErrors?.length > 0)) {
      const errorMessage = graphqlData.errors?.[0]?.message || 
                          graphqlData.data?.staffMemberCreate?.userErrors?.[0]?.message ||
                          'Erreur inconnue lors de la création du staff';
      
      throw new Error(errorMessage);
    }

    // Mettre à jour la notification comme complétée
    await prisma.notification.update({
      where: { id: Number(notificationId) },
      data: { complete: true }
    });

    return {
      success: true,
      staffMember: graphqlData.data.staffMemberCreate.staffMember
    };
  } catch (error) {
    console.error('Erreur lors de la création du compte staff:', error);
    throw error;
  }
}