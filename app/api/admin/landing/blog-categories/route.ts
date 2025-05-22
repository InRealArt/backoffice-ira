import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        

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
        console.error('Erreur lors de la récupération des catégories:', error)
        return NextResponse.json(
            { success: false, error: 'Erreur serveur' },
            { status: 500 }
        )
    }
} 