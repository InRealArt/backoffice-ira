import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeJwtToken } from '../utils';
import { BackofficeUserRoles } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { email, walletAddress, userMetadata } = await request.json();

    // Récupérer le token depuis les en-têtes de la requête
    const authToken = request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!authToken) {
        return NextResponse.json(
            { message: 'Non authentifié. Veuillez vous connecter.' },
            { status: 401 }
        )
    }
    else {
        // Décoder le JWT pour extraire les informations
        const {user, message} = await decodeJwtToken(authToken)
        if (!user || typeof user !== 'object') {
            return NextResponse.json(
                { message: 'Token invalide ou expiré' },
                { status: 401 }
            )
        }   
        console.log('User authentifié:', user)
        if (user.role !== BackofficeUserRoles.admin) {
            return NextResponse.json(
                { message: 'Accès refusé. Vous n\'êtes pas autorisé à effectuer cette action.' },
                { status: 403 }
            )
        }
    }

    const user = await prisma.backofficeUser.upsert({
      where: { email },
      update: {
        email,
        walletAddress,
        lastLogin: new Date(),
        userMetadata
      },
      create: {
        email,
        walletAddress,
        lastLogin: new Date(),
        userMetadata
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save user' },
      { status: 500 }
    );
  }
}