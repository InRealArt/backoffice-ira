'use server'

interface SendEmailParams {
    to: string
    subject: string
    html: string
    text?: string
}

/**
 * Service pour envoyer des emails via l'API Brevo
 */
export async function sendEmailViaBrevo({
    to,
    subject,
    html,
    text
}: SendEmailParams): Promise<{ success: boolean; message?: string }> {
    try {
        const apiKey = process.env.BREVO_API_KEY

        if (!apiKey) {
            console.error('BREVO_API_KEY n\'est pas configurée')
            return {
                success: false,
                message: 'Configuration email manquante'
            }
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: 'InRealArt',
                    email: process.env.BREVO_SENDER_EMAIL || 'teaminrealart@gmail.com'
                },
                to: [
                    {
                        email: to
                    }
                ],
                subject,
                htmlContent: html,
                textContent: text || subject
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Erreur Brevo:', errorData)
            return {
                success: false,
                message: errorData.message || 'Erreur lors de l\'envoi de l\'email'
            }
        }

        return {
            success: true
        }
    } catch (error: any) {
        console.error('Erreur lors de l\'envoi de l\'email via Brevo:', error)
        return {
            success: false,
            message: error.message || 'Erreur lors de l\'envoi de l\'email'
        }
    }
}

