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
        const userData = await prisma.shopifyUser.findUnique({
            where: {
                walletAddress: walletAddress,
            },
            select: {
                role: true,
            },
        });

        // Vérifier si l'utilisateur est admin
        const isAdmin = userData?.role === 'admin';

        // Retourner les données
        return NextResponse.json({
            data: userData ? [userData] : [],
            isAdmin: !!isAdmin
        });

    } catch (error) {
        console.error('Exception dans l\'API:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}