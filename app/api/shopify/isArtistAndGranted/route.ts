import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Adresse wallet manquante' }, 
        { status: 400 }
      );
    }
    
    // Requête à la table ShopifyUser avec Prisma
    const userData = await prisma.backofficeUser.findUnique({
      where: {
        walletAddress: walletAddress,
      },
      select: {
        isShopifyGranted: true,
        role: true,
      },
    });
    
    // Vérifier si l'utilisateur a accès
    const hasAccess = userData?.isShopifyGranted && 
      (userData?.role === 'artist' || userData?.role === 'galleryManager');
    
    // Retourner les données trouvées
    return NextResponse.json({ 
      data: userData ? [userData] : [], 
      hasAccess: !!hasAccess
    });
    
  } catch (error) {
    console.error('Exception dans l\'API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}