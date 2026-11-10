// Résolution des URL d'authentification selon l'environnement Vercel (logique pure, testable).
//
// En prévisualisation, l'URL change à chaque branche et à chaque déploiement : on autorise uniquement
// les hôtes fournis par Vercel (jamais un joker *.vercel.app : n'importe qui peut publier un site sur
// ce domaine). BETTER_AUTH_URL pointe vers la production et ne doit pas s'appliquer à une preview.

type Env = Record<string, string | undefined>

const PRODUCTION_URL = 'https://backoffice-inrealart.vercel.app'

export function resolveAuthUrls(env: Env) {
    const isPreview = env.VERCEL_ENV === 'preview'
    const toUrl = (host?: string) => (host ? `https://${host}` : undefined)

    if (isPreview) {
        const branchUrl = toUrl(env.VERCEL_BRANCH_URL)
        const deploymentUrl = toUrl(env.VERCEL_URL)
        return {
            // URL stable de la branche, sinon celle du déploiement (déploiement CLI sans branche git)
            baseURL: branchUrl ?? deploymentUrl,
            previewOrigins: [deploymentUrl, branchUrl].filter((url): url is string => Boolean(url))
        }
    }

    return {
        baseURL: env.BETTER_AUTH_URL || (env.VERCEL_ENV === 'production' ? PRODUCTION_URL : undefined),
        previewOrigins: [] as string[]
    }
}
