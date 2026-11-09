import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { unauthorizedResponse } from '@/lib/api-auth'

export async function GET() {
    try {
        // Contenu de blog réservé au backoffice (administrateurs)
        await requireAdmin()
        

        // Récupérer toutes les catégories
        const categories = await prisma.seoCategory.findMany({
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json({
            success: true,
            categories
        })
    } catch (error) {
        const denied = unauthorizedResponse(error)
        if (denied) return denied
        console.error('Erreur lors de la récupération des catégories:', error)
        return NextResponse.json(
            { success: false, error: 'Erreur serveur' },
            { status: 500 }
        )
    }
} 