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

        // Requête pour vérifier si le wallet principal est admin
        const userDirectData = await prisma.shopifyUser.findUnique({
            where: {
                walletAddress: walletAddress,
            },
            select: {
                role: true,
            },
        });

        // Vérifier si le wallet est un wallet lié d'un admin
        const userWithLinkedWallet = await prisma.shopifyUser.findFirst({
            where: {
                linkedWallets: {
                    array_contains: [{ address: walletAddress }],
                },
                role: 'admin'
            },
            select: {
                role: true,
            },
        });

        // console.log('userDirectData', userDirectData)
        // console.log('userWithLinkedWallet', userWithLinkedWallet)
        // L'utilisateur est admin si son wallet principal est admin OU si c'est un wallet lié à un admin
        const isAdmin = userDirectData?.role === 'admin' || userWithLinkedWallet?.role === 'admin';

        // Combinaison des résultats
        const userData = userDirectData || userWithLinkedWallet;

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