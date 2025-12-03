import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'
import { sendEmailViaBrevo } from './services/brevo'
import { getResetPasswordEmailTemplate } from './templates/reset-password-email'

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'postgresql'
    }),
    // Origines de confiance pour CORS et sécurité
    trustedOrigins: [
        'https://backoffice-shopify.vercel.app',
        'https://backoffice-inrealart.vercel.app'
    ],
    // on cible explicitement les modèles Prisma mappés au schéma backoffice
    user: {
        modelName: 'BackofficeAuthUser',
        additionalFields: {
            role: {
                type: 'string',
                required: false,
                input: false
            },
            artistId: {
                type: 'number',
                required: false,
                input: true
            }
        }
    },
    session: {
        modelName: 'BackofficeAuthSession',
        // Activer le cookie cache pour réduire les appels DB
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // 5 minutes
        }
    },
    account: {
        modelName: 'BackofficeAuthAccount'
    },
    verification: {
        modelName: 'BackofficeAuthVerification'
    },
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url, token }, request) => {
            const isVercel = !!process.env.VERCEL
            const isProduction = process.env.NODE_ENV === 'production'

            console.log('[Auth] Demande de réinitialisation de mot de passe:', {
                userId: user.id,
                userEmail: user.email,
                hasToken: !!token,
                urlLength: url.length,
                origin: request?.headers?.get('origin') || 'unknown',
                platform: isVercel ? 'Vercel' : 'Other',
                environment: isProduction ? 'production' : 'development',
                hasBrevoKey: !!process.env.BREVO_API_KEY,
                brevoKeyPrefix: process.env.BREVO_API_KEY ? `${process.env.BREVO_API_KEY.substring(0, 8)}...` : 'missing'
            })

            // Sur Vercel en production, on doit attendre l'envoi pour éviter que la fonction se termine
            // Mais on le fait de manière non bloquante avec un timeout
            const emailPromise = sendEmailViaBrevo({
                to: user.email,
                subject: 'Réinitialisation de votre mot de passe - InRealArt',
                html: getResetPasswordEmailTemplate(url, user.name || undefined)
            })
                .then((result) => {
                    if (result.success) {
                        console.log('[Auth] ✅ Email de réinitialisation envoyé avec succès à:', user.email)
                    } else {
                        console.error('[Auth] ❌ Échec de l\'envoi de l\'email de réinitialisation:', {
                            email: user.email,
                            error: result.message
                        })
                    }
                    return result
                })
                .catch((error) => {
                    console.error('[Auth] ❌ Erreur lors de l\'envoi de l\'email de reset password:', {
                        email: user.email,
                        error: error.message,
                        stack: error.stack,
                        name: error.name
                    })
                    return { success: false, message: error.message }
                })

            // Sur Vercel, il est CRUCIAL d'attendre l'envoi de l'email
            // Sinon la fonction serverless se termine avant que le fetch ne soit complété
            if (isVercel || isProduction) {
                try {
                    // Attendre réellement l'envoi avec un timeout de 8 secondes
                    const result = await Promise.race([
                        emailPromise,
                        new Promise<{ success: false; message: string }>((resolve) =>
                            setTimeout(() => {
                                console.warn('[Auth] ⚠️ Timeout lors de l\'envoi de l\'email (8s)')
                                resolve({ success: false, message: 'Timeout après 8 secondes' })
                            }, 8000)
                        )
                    ])

                    if (result.success) {
                        console.log('[Auth] ✅ Email envoyé et confirmé avant la fin de la fonction')
                    } else {
                        console.error('[Auth] ❌ Échec confirmé de l\'envoi:', result.message)
                    }
                } catch (error: any) {
                    console.error('[Auth] ❌ Erreur lors de l\'attente de l\'envoi:', {
                        error: error.message,
                        stack: error.stack
                    })
                }
            } else {
                // En développement local, on peut utiliser void pour éviter les timing attacks
                void emailPromise
            }
        }
    }
})



