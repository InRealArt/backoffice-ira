import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireBackofficeUser } from '@/lib/auth-helpers'
import { requirePhysicalItemAccess } from '@/lib/auth-ownership'
import { unauthorizedResponse } from '@/lib/api-auth'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Session backoffice exigée ; la propriété de l'œuvre est vérifiée plus bas
        await requireBackofficeUser()

        const resolvedParams = await params
        const id = parseInt(resolvedParams.id)

        if (isNaN(id)) {
            return new NextResponse('ID invalide', { status: 400 })
        }

        const certificate = await prisma.authCertificatePhysicalArtwork.findUnique({
            where: { id }
        })

        if (!certificate) {
            return new NextResponse('Certificat non trouvé', { status: 404 })
        }

        // Admin, ou propriétaire de l'œuvre associée au certificat
        await requirePhysicalItemAccess(certificate.physicalItemId)

        // Construire la réponse avec le fichier PDF
        const response = new NextResponse(Buffer.from(certificate.file), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="certificate-${id}.pdf"`,
            },
        })

        return response
    } catch (error) {
        const denied = unauthorizedResponse(error)
        if (denied) {
            return new NextResponse(error instanceof Error ? error.message : 'Non autorisé', { status: denied.status })
        }
        console.error('Erreur lors de la récupération du certificat:', error)
        return new NextResponse('Erreur serveur', { status: 500 })
    }
} 