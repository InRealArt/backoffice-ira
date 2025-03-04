/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Désactive complètement la vérification ESLint pendant le build
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['cdn.shopify.com', 'firebasestorage.googleapis.com'],
  },
  // Conservez vos autres configurations existantes ici
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Désactiver l'overlay d'erreur et le rechargement automatique
      config.devServer = {
        ...config.devServer,
        client: {
          ...config.devServer?.client,
          overlay: false,
        },
      }
    }
    return config
  }
}

module.exports = nextConfig 