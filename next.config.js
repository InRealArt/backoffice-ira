/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Désactive complètement la vérification ESLint pendant le build
    ignoreDuringBuilds: true,
  },
  // Conservez vos autres configurations existantes ici
}

module.exports = nextConfig 