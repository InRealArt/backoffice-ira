/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Désactive complètement la vérification ESLint pendant le build
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['cdn.shopify.com'],
  },
  // Conservez vos autres configurations existantes ici
}

module.exports = nextConfig 