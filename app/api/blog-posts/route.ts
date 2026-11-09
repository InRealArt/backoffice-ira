import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { unauthorizedResponse } from '@/lib/api-auth'
import { headers } from 'next/headers'

export async function GET() {
    try {
        // Contenu de blog réservé au backoffice (administrateurs)
        await requireAdmin()
        
        // Vérifier d'abord si des enregistrements existent
        const count = await prisma.seoPost.count()

        if (count === 0) {
            // Aucun enregistrement, retourner un tableau vide
            return NextResponse.json([])
        }

        // Récupération des articles de blog (uniquement s'ils existent)
        const posts = await prisma.seoPost.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                category: true
            }
        })

        return NextResponse.json(posts)
    } catch (error) {
        const denied = unauthorizedResponse(error)
        if (denied) return denied
        console.error('Error when loading the blog articles:', error)
        return NextResponse.json(
            { error: 'Error when loading the blog articles' },
            { status: 500 }
        )
    }
} 