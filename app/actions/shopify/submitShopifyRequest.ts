'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function submitShopifyRequest(formData: { 
  email: string, 
  firstName: string, 
  lastName: string 
}) {
  try {
    // Vérifier que l'email existe
    if (!formData.email) {
      throw new Error("L'email est requis");
    }

    // Créer la notification
    await prisma.notification.create({
      data: {
        from: formData.email,
        subject: 'requestShopifyMember'
      }
    });

    // Actualiser le dashboard après modification
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    return { 
      success: false, 
      error: "Une erreur est survenue lors de l'envoi de votre demande"
    };
  }
}