import { betterAuth } from 'better-auth'
import { after } from 'next/server'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'
import { sendEmailViaBrevo } from './services/brevo'
import { getResetPasswordEmailTemplate } from './templates/reset-password-email'

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'postgresql'
    }),
    // URL de base utilisée pour construire les liens (ex. lien de reset password dans l'email).
    // BETTER_AUTH_URL en priorité ; en production Vercel, fallback sur le domaine officiel.
    baseURL: process.env.BETTER_AUTH_URL
        || (process.env.VERCEL_ENV === 'production' ? 'https://backoffice-inrealart.vercel.app' : undefined),
    // Origines de confiance pour CORS et sécurité
    trustedOrigins: [
        'https://backoffice-shopify.vercel.app',
        'https://backoffice-inrealart.vercel.app',
        ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : [])
    ],
    // Garde la fonction serverless en vie jusqu'à la fin de l'envoi de l'email
    advanced: {
        backgroundTasks: {
            handler: (promise) => after(promise)
        }
    },
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
        // Durée de validité du lien de réinitialisation : 1 heure
        resetPasswordTokenExpiresIn: 60 * 60,
        // Après un reset, on invalide toutes les autres sessions (sécurité)
        revokeSessionsOnPasswordReset: true,
        // Appelé en tâche de fond (advanced.backgroundTasks) : la réponse HTTP ne dépend pas
        // de Brevo, donc pas de différence de temps entre email connu et inconnu.
        sendResetPassword: async ({ user, url }) => {
            const result = await sendEmailViaBrevo({
                to: user.email,
                subject: 'Réinitialisation de votre mot de passe - InRealArt',
                html: getResetPasswordEmailTemplate(url, user.name || undefined)
            })
            if (!result.success) {
                console.error('[Auth] Échec envoi email reset password:', result.message)
            }
        },
        onPasswordReset: async ({ user }) => {
            console.log('[Auth] Mot de passe réinitialisé pour l\'utilisateur:', user.id)
        }
    }
})



