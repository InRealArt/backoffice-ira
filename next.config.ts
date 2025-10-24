import type { NextConfig } from "next";
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin'

const nextConfig: NextConfig = {
  // Désactiver les Cache Components pour la compatibilité avec les configurations de route existantes
  // cacheComponents: true,

  // Output standalone pour Vercel
  output: 'standalone',

  // Configurer les fichiers externes pour Prisma (nouvelle syntaxe Next.js 16)
  serverExternalPackages: ['@prisma/client', '@prisma/engines'],

  // Configuration expérimentale pour le cache du système de fichiers Turbopack
  experimental: {
    turbopackFileSystemCacheForDev: true,
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

  // Configuration Turbopack pour remplacer webpack
  turbopack: {
    // Configuration vide pour éviter les conflits avec webpack
  },

  // Configuration webpack pour copier les moteurs Prisma dans Lambda
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()]
    }
    return config
  },
};

export default nextConfig;
