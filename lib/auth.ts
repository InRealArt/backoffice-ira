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
            console.log('[Auth] Demande de réinitialisation de mot de passe:', {
                userId: user.id,
                userEmail: user.email,
                hasToken: !!token,
                urlLength: url.length,
                origin: request?.headers?.get('origin') || 'unknown'
            })

            // Ne pas attendre l'envoi de l'email pour éviter les timing attacks
            // Mais on log le résultat pour le débogage
            sendEmailViaBrevo({
                to: user.email,
                subject: 'Réinitialisation de votre mot de passe - InRealArt',
                html: getResetPasswordEmailTemplate(url, user.name || undefined)
            })
                .then((result) => {
                    if (result.success) {
                        console.log('[Auth] Email de réinitialisation envoyé avec succès à:', user.email)
                    } else {
                        console.error('[Auth] Échec de l\'envoi de l\'email de réinitialisation:', {
                            email: user.email,
                            error: result.message
                        })
                    }
                })
                .catch((error) => {
                    console.error('[Auth] Erreur lors de l\'envoi de l\'email de reset password:', {
                        email: user.email,
                        error: error.message,
                        stack: error.stack
                    })
                })
        }
    }
})



