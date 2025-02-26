'use server';

import { prisma } from '@/lib/prisma';
import { NotificationStatus } from '@prisma/client';

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

