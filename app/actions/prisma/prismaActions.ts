'use server';

import { memberSchema } from "@/app/admin/shopify/create-member/schema";
import { MemberFormData } from "@/app/admin/shopify/create-member/schema";
import { prisma } from "@/lib/prisma"
import { NotificationStatus } from "@prisma/client"
import { revalidatePath } from "next/cache";

type UpdateNotificationResult = {
    success: boolean
    message: string
  }

  type CreateMemberResult = {
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
      
    
      // Revalider le chemin des notifications pour forcer le rafraîchissement
      revalidatePath('/notifications')

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

  export async function createMember(data: MemberFormData): Promise<CreateMemberResult> {
    try {
      // Valider les données avec Zod
      const validatedData = memberSchema.parse(data)
      
      // Vérifier si l'email existe déjà
      const existingUser = await prisma.shopifyUser.findUnique({
        where: { email: validatedData.email }
      })
      
      if (existingUser) {
        return {
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        }
      }
      
      // Créer l'utilisateur dans la base de données
      await prisma.shopifyUser.create({
        data: {
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: validatedData.role,
          walletAddress: '', // Valeur par défaut pour le champ obligatoire
          lastLogin: new Date(), // Date actuelle par défaut
          userMetadata: {} 
        }
      })
      
      // Rafraîchir la page après création
      revalidatePath('/admin/shopify/create-member')
      
      return {
        success: true,
        message: 'Membre créé avec succès'
      }
    } catch (error) {
      console.error('Erreur lors de la création du membre:', error)
      
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message || 'Une erreur est survenue lors de la création du membre'
        }
      }
      
      return {
        success: false,
        message: 'Une erreur inconnue est survenue'
      }
    }
  }  