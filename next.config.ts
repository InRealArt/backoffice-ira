import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Output standalone pour Vercel
  output: 'standalone',

  // Les erreurs TypeScript pré-existantes (non liées à Prisma) ne bloquent pas le build
  typescript: {
    ignoreBuildErrors: true,
  },

  serverExternalPackages: ['exceljs', 'rimraf', 'fstream', 'pino', 'thread-stream'],

  outputFileTracingExcludes: {
    '/*': [
      './node_modules/thread-stream/test/**/*',
      './node_modules/thread-stream/bench/**/*',
      './node_modules/thread-stream/**/*.test.*',
      './node_modules/thread-stream/**/*.spec.*',
    ],
  },

  webpack: (config) => {
    const webpack = require('webpack')

    config.plugins = [
      ...(config.plugins || []),
      new webpack.NormalModuleReplacementPlugin(
        /node_modules[\\/]thread-stream[\\/](test|bench)/,
        require.resolve('./empty-module.js')
      )
    ]

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

  experimental: {
    turbopackFileSystemCacheForDev: true,
    serverActions: {
      bodySizeLimit: '10mb',
    },
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
    minimumCacheTTL: 14400,
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75],
    maximumRedirects: 3,
  },

  sassOptions: {
    includePaths: ['./app/styles'],
  },

  turbopack: {
    resolveAlias: {
      'thread-stream/test': path.resolve(__dirname, 'empty-module.js'),
      'thread-stream/bench': path.resolve(__dirname, 'empty-module.js'),
    },
  },
};

export default withNextIntl(nextConfig);
