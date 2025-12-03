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
        const senderEmail = process.env.BREVO_SENDER_EMAIL || 'teaminrealart@gmail.com'

        // Log pour déboguer (sans exposer la clé API complète)
        console.log('[Brevo] Tentative d\'envoi d\'email:', {
            to,
            subject,
            senderEmail,
            hasApiKey: !!apiKey,
            apiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}...` : 'missing',
            environment: process.env.NODE_ENV
        })

        if (!apiKey) {
            const errorMsg = 'BREVO_API_KEY n\'est pas configurée dans les variables d\'environnement'
            console.error('[Brevo]', errorMsg)
            return {
                success: false,
                message: errorMsg
            }
        }

        const emailPayload = {
            sender: {
                name: 'InRealArt',
                email: senderEmail
            },
            to: [
                {
                    email: to
                }
            ],
            subject,
            htmlContent: html,
            textContent: text || subject
        }

        console.log('[Brevo] Payload email (sans contenu HTML):', {
            ...emailPayload,
            htmlContent: `[${html.length} caractères]`,
            textContent: emailPayload.textContent
        })

        // Configuration du fetch avec timeout pour Vercel
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 secondes max

        try {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': apiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify(emailPayload),
                signal: controller.signal
            })
            
            clearTimeout(timeoutId)

            const responseText = await response.text()
            console.log('[Brevo] Réponse HTTP:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                responseLength: responseText.length
            })

            if (!response.ok) {
                let errorData: any = {}
                try {
                    errorData = JSON.parse(responseText)
                } catch (e) {
                    errorData = { rawResponse: responseText }
                }

                console.error('[Brevo] ❌ Erreur API:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData,
                    responseText: responseText.substring(0, 500) // Limiter la taille du log
                })

                return {
                    success: false,
                    message: errorData.message || errorData.error || `Erreur HTTP ${response.status}: ${response.statusText}`
                }
            }

            let successData: any = {}
            try {
                successData = JSON.parse(responseText)
            } catch (e) {
                // La réponse peut être vide en cas de succès
            }

            console.log('[Brevo] ✅ Email envoyé avec succès:', successData)
            return {
                success: true
            }
        } catch (fetchError: any) {
            clearTimeout(timeoutId)
            
            if (fetchError.name === 'AbortError') {
                console.error('[Brevo] ❌ Timeout lors de l\'appel à l\'API Brevo (10s)')
                return {
                    success: false,
                    message: 'Timeout lors de l\'envoi de l\'email (10 secondes)'
                }
            }
            
            throw fetchError // Re-lancer les autres erreurs
        }
    } catch (error: any) {
        console.error('[Brevo] Erreur lors de l\'envoi de l\'email:', {
            error: error.message,
            stack: error.stack,
            name: error.name
        })
        return {
            success: false,
            message: error.message || 'Erreur lors de l\'envoi de l\'email'
        }
    }
}


