import { NextRequest, NextResponse } from 'next/server'

const PINATA_JWT = process.env.PINATA_JWT

export async function POST(req: NextRequest) {
    try {
        // Vérifier si le JWT est configuré
        if (!PINATA_JWT) {
            return NextResponse.json(
                { error: 'Configuration Pinata manquante' },
                { status: 500 }
            )
        }

        // Récupérer le fichier depuis la requête FormData
        const formData = await req.formData()
        const file = formData.get('file')

        // Vérifier si un fichier a été fourni
        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: 'Aucun fichier fourni' },
                { status: 400 }
            )
        }

        // Préparer les données pour Pinata
        const uploadData = new FormData()
        uploadData.append('file', file)
        uploadData.append('network', formData.get('network') || 'public')

        // Paramètres optionnels
        const name = formData.get('name')
        if (name) uploadData.append('name', name.toString())

        // Envoyer le fichier à Pinata
        const request = await fetch(
            'https://uploads.pinata.cloud/v3/files',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${PINATA_JWT}`,
                },
                body: uploadData,
            }
        )

        // Vérifier si la requête a échoué
        if (!request.ok) {
            const errorData = await request.json().catch(() => null)
            return NextResponse.json(
                {
                    error: 'Erreur lors de l\'upload sur Pinata',
                    details: errorData
                },
                { status: request.status }
            )
        }

        // Récupérer et retourner la réponse
        const response = await request.json()
        return NextResponse.json(response)
    } catch (error) {
        console.error('Erreur lors de l\'upload du fichier:', error)
        return NextResponse.json(
            { error: 'Erreur lors du traitement de la requête' },
            { status: 500 }
        )
    }
} 