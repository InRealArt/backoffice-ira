import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        // Extraire l'adresse de l'URL
        const url = new URL(request.url)
        const address = url.searchParams.get('address')

        if (!address) {
            return NextResponse.json(
                { error: 'Adresse du portefeuille requise' },
                { status: 400 }
            )
        }

        // Récupérer l'utilisateur et ses wallets liés
        const user = await prisma.shopifyUser.findUnique({
            where: { walletAddress: address },
            select: { linkedWallets: true }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            linkedWallets: user.linkedWallets || []
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des wallets liés:', error)
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        )
    }
} 