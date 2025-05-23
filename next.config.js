/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Désactive complètement la vérification ESLint pendant le build
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'crypto-economy.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.staticimg.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      // Autoriser d'autres domaines couramment utilisés pour les images de blog
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.pexels.com',
      },
      {
        protocol: 'https',
        hostname: '**.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      }
    ],
    // Garder domains pour la compatibilité avec d'anciens composants
    domains: ['cdn.shopify.com', 'firebasestorage.googleapis.com', 'crypto-economy.com', 'assets.staticimg.com'],
  },
  // Configuration pour les styles et PostCSS
  sassOptions: {
    // Utiliser les variables SCSS
    includePaths: ['./app/styles'],
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
    
    // Optimisation spécifique pour les bundles CSS
    if (!dev && !isServer) {
      // S'assurer que la minification CSS est activée
      config.optimization.minimizer = config.optimization.minimizer || [];
      
      // Utiliser le mode production pour tous les loaders CSS
      config.module.rules.forEach((rule) => {
        if (rule.oneOf) {
          rule.oneOf.forEach((r) => {
            if (r.test && r.test.toString().includes('css|scss|sass')) {
              if (r.use && Array.isArray(r.use)) {
                r.use.forEach((loader) => {
                  if (loader.options && typeof loader.options === 'object') {
                    // Forcer le mode production pour les loaders CSS
                    loader.options.sourceMap = false;
                  }
                });
              }
            }
          });
        }
      });
    }
    
    return config;
  }
}

module.exports = nextConfig 