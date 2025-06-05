import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com/',
        port: '',
        pathname: '/**',
      }
    ],
  },
  serverActions: {
    bodySizeLimit: '5mb', // Augmenter la limite à 10MB pour gérer les uploads de fichiers
  },
};

export default nextConfig;
