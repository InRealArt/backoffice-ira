'use server';

import { prisma } from "@/lib/prisma"
import { NotificationStatus } from "@prisma/client"

type UpdateNotificationResult = {
    success: boolean
    message: string
  }

// Action pour mettre à jour le statut d'une notification
export async function updateNotificationStatus(
    notificationId: number, 
    status: NotificationStatus
  ): Promise<UpdateNotificationResult> {
    try {
      if (!notificationId) {
        return {
          success: false,
          message: 'ID de notification requis'
        }
      }
  
      // Mise à jour du statut de la notification
      await prisma.notification.update({
        where: {
          id: notificationId
        },
        data: {
          status: status,
          complete: true
        }
      })
      
      return { 
        success: true,
        message: `Statut de la notification mis à jour avec succès`
      }
    } catch (error: any) {
      console.error('Erreur serveur lors de la mise à jour de notification:', error)
      return {
        success: false,
        message: error.message || 'Une erreur est survenue lors de la mise à jour du statut'
      }
    }
  }