import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decodeJwtToken } from '@/app/api/auth/utils'
import { BackofficeUserRoles } from '@prisma/client'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const { user, message } = await decodeJwtToken(authToken)
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

    try {
        // Récupérer les paramètres depuis la Promise
        const resolvedParams = await params

        // Vérifier si l'ID est valide
        const id = parseInt(resolvedParams.id)
        if (isNaN(id)) {
            return NextResponse.json(
                { message: 'ID de collection invalide' },
                { status: 400 }
            )
        }

        // Vérifier si la collection existe
        const collection = await prisma.nftCollection.findUnique({
            where: { id },
        })

        if (!collection) {
            return NextResponse.json(
                { message: 'Collection non trouvée' },
                { status: 404 }
            )
        }

        // Supprimer la collection
        await prisma.nftCollection.delete({
            where: { id }
        })

        // Retourner une réponse de succès
        return NextResponse.json(
            { message: 'Collection supprimée avec succès' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Erreur lors de la suppression de la collection:', error)

        return NextResponse.json(
            {
                message: 'Une erreur est survenue lors de la suppression de la collection',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
} 