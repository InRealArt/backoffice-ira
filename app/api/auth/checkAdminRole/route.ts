import { NextResponse } from 'next/server'
import { checkIsAdmin } from '@/app/actions/prisma/prismaActions'

export async function POST(request: Request) {
    try {
        const { email, walletAddress } = await request.json()

        if (!email && !walletAddress) {
            return NextResponse.json({
                isAdmin: false,
                message: 'Email ou adresse de portefeuille requis'
            }, { status: 400 })
        }

        // Vérifier si l'utilisateur est un admin via la fonction prismaActions
        const result = await checkIsAdmin(email, walletAddress)

        return NextResponse.json({
            isAdmin: result.isAdmin,
            message: result.isAdmin ? 'Utilisateur avec droits admin' : 'Utilisateur sans droits admin'
        })

    } catch (error) {
        console.error('Erreur lors de la vérification du rôle admin:', error)
        return NextResponse.json({
            isAdmin: false,
            message: 'Erreur serveur'
        }, { status: 500 })
    }
} 