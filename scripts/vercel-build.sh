#!/bin/bash

# Script de build pour Vercel avec Prisma
echo "🔧 Génération du client Prisma..."
npx prisma generate --force

echo "🏗️ Build de l'application Next.js..."
npm run build
