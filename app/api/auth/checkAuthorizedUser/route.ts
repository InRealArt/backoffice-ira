import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({
                authorized: false,
                message: 'Email manquant'
            }, { status: 400 })
        }

        // Vérifier si l'email existe dans la table shopifyUser
        const user = await prisma.backofficeUser.findUnique({
            where: { email }
        })

        return NextResponse.json({
            authorized: !!user,
            message: user ? 'Utilisateur autorisé' : 'Utilisateur non autorisé'
        })

    } catch (error) {
        console.error('Erreur lors de la vérification de l\'autorisation:', error)
        return NextResponse.json({
            authorized: false,
            message: 'Erreur serveur'
        }, { status: 500 })
    }
} 