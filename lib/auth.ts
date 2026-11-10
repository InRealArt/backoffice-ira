import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { after } from 'next/server'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'
import { resolveAuthUrls } from './auth-urls'
import { sendEmailViaBrevo } from './services/brevo'
import { getResetPasswordEmailTemplate } from './templates/reset-password-email'

const { baseURL, previewOrigins } = resolveAuthUrls(process.env)

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'postgresql'
    }),
    // URL de base utilisée pour construire les liens (ex. lien de reset password dans l'email).
    // Voir lib/auth-urls.ts : URL de la branche en prévisualisation, BETTER_AUTH_URL ailleurs.
    baseURL,
    // Origines de confiance pour CORS et sécurité
    trustedOrigins: [
        'https://backoffice-shopify.vercel.app',
        'https://backoffice-inrealart.vercel.app',
        ...previewOrigins,
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
            // input: false → jamais modifiable par le client (sign-up ou update-user).
            // La valeur est posée côté serveur depuis la liste blanche (databaseHooks ci-dessous).
            artistId: {
                type: 'number',
                required: false,
                input: false
            }
        }
    },
    // Sécurité : l'inscription est publique (/api/auth/sign-up/email est appelable directement),
    // donc la liste blanche est appliquée ICI, côté serveur, et non par le client.
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    // Insensible à la casse : Better Auth normalise l'email en minuscules, alors que
                    // la whitelist peut contenir la casse saisie par l'admin.
                    const whiteListed = await prisma.whiteListedUser.findFirst({
                        where: { email: { equals: user.email.trim(), mode: 'insensitive' } },
                        select: { role: true, artistId: true }
                    })

                    if (!whiteListed) {
                        throw new APIError('FORBIDDEN', {
                            message: "Votre email n'est pas autorisé à créer un compte sur cette plateforme. Veuillez contacter l'administrateur pour être ajouté à la liste blanche."
                        })
                    }

                    // Rôle et artistId imposés par la whitelist : jamais ceux fournis par le client
                    return {
                        data: {
                            role: whiteListed.role ?? null,
                            artistId: whiteListed.artistId ?? null
                        }
                    }
                }
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



