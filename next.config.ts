import type { NextConfig } from "next";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import path from "path";

const nextConfig: NextConfig = {
  // Désactiver les Cache Components pour la compatibilité avec les configurations de route existantes
  // cacheComponents: true,

  // Output standalone pour Vercel
  output: 'standalone',

  // Configurer les fichiers externes pour Prisma (nouvelle syntaxe Next.js 16)
  // Ajouter pino pour éviter que Turbopack traite thread-stream (utilisé par pino)
  serverExternalPackages: ['@prisma/client', '@prisma/engines', 'exceljs', 'rimraf', 'fstream', 'pino', 'thread-stream'],

  // SOLUTION FINALE : Inclure les moteurs Prisma dans le file tracing
  // Cette configuration garantit que tous les binaires Prisma sont inclus dans le build
  // Inclure pour toutes les routes (y compris le middleware)
  outputFileTracingIncludes: {
    '/api/**': [
      './node_modules/.prisma/client/**/*',
      './node_modules/@prisma/client/**/*',
      './node_modules/@prisma/engines/**/*',
      './node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node',
      './node_modules/.prisma/client/query-engine-rhel-openssl-3.0.x',
    ],
    '/*': [
      './node_modules/.prisma/client/**/*',
      './node_modules/@prisma/client/**/*',
      './node_modules/@prisma/engines/**/*',
      // Inclure explicitement les binaires rhel-openssl-3.0.x
      './node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node',
      './node_modules/.prisma/client/query-engine-rhel-openssl-3.0.x',
    ],
  },

  // Exclure les fichiers de test et de benchmark du file tracing
  outputFileTracingExcludes: {
    '/*': [
      './node_modules/thread-stream/test/**/*',
      './node_modules/thread-stream/bench/**/*',
      './node_modules/thread-stream/**/*.test.*',
      './node_modules/thread-stream/**/*.spec.*',
    ],
  },

  // Plugin webpack pour copier les moteurs Prisma dans .next/server
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...(config.plugins || []), new PrismaPlugin()];
    }

    // Ignorer les fichiers de test et de benchmark dans node_modules
    // Utiliser NormalModuleReplacementPlugin pour remplacer les imports de test
    const webpack = require('webpack')
    config.plugins = [
      ...(config.plugins || []),
      new webpack.NormalModuleReplacementPlugin(
        /node_modules[\\/]thread-stream[\\/](test|bench)/,
        require.resolve('./empty-module.js')
      )
    ]

    // Ignorer les warnings pour les fichiers de test
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /node_modules[\\/]thread-stream[\\/]test/,
      /node_modules[\\/]thread-stream[\\/]bench/,
      /Module not found.*thread-stream.*test/,
      /Module not found.*thread-stream.*bench/,
      /Missing module type.*thread-stream/,
      /Unknown module type.*thread-stream/
    ]

    return config;
  },

  // Configuration expérimentale pour le cache du système de fichiers Turbopack
  experimental: {
    turbopackFileSystemCacheForDev: true,
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Optimiser la compilation TypeScript
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      '@tanstack/react-query',
      'date-fns',
    ],
  },

  images: {
    remotePatterns: [
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
    // Nouvelles valeurs par défaut de Next.js 16
    minimumCacheTTL: 14400, // 4 heures au lieu de 60s
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Suppression de 16 par défaut
    qualities: [75], // Qualité par défaut à 75
    maximumRedirects: 3, // Maximum 3 redirections
  },

  // Configuration pour les styles et PostCSS
  sassOptions: {
    // Utiliser les variables SCSS
    includePaths: ['./app/styles'],
  },

  // Configuration Turbopack pour exclure les fichiers de test
  turbopack: {
    resolveAlias: {
      // Ignorer les fichiers de test et de benchmark de thread-stream
      'thread-stream/test': path.resolve(__dirname, 'empty-module.js'),
      'thread-stream/bench': path.resolve(__dirname, 'empty-module.js'),
    },
  },
};

export default nextConfig;
