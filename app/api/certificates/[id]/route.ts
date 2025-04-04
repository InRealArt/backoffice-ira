import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const id = parseInt(resolvedParams.id)

        if (isNaN(id)) {
            return new NextResponse('ID invalide', { status: 400 })
        }

        const certificate = await prisma.authCertificate.findUnique({
            where: { id }
        })

        if (!certificate) {
            return new NextResponse('Certificat non trouvé', { status: 404 })
        }

        // Construire la réponse avec le fichier PDF
        const response = new NextResponse(Buffer.from(certificate.file), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="certificate-${id}.pdf"`,
            },
        })

        return response
    } catch (error) {
        console.error('Erreur lors de la récupération du certificat:', error)
        return new NextResponse('Erreur serveur', { status: 500 })
    }
} 