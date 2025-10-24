#!/bin/bash

# Script pour copier les moteurs Prisma dans le build standalone
# Nécessaire pour le déploiement sur Vercel avec Next.js 16

echo "🔧 Copie des moteurs Prisma dans le build standalone..."

# Vérifier si le dossier standalone existe
if [ ! -d ".next/standalone" ]; then
  echo "⚠️  Le dossier .next/standalone n'existe pas. Exécutez 'npm run build' d'abord."
  exit 0
fi

# Créer le dossier de destination
mkdir -p .next/standalone/node_modules/.prisma/client

# Copier tous les moteurs Prisma
cp -r node_modules/.prisma/client/* .next/standalone/node_modules/.prisma/client/

# Copier aussi @prisma/client
mkdir -p .next/standalone/node_modules/@prisma
cp -r node_modules/@prisma/client .next/standalone/node_modules/@prisma/

echo "✅ Moteurs Prisma copiés avec succès dans .next/standalone"
echo "📦 Fichiers copiés :"
ls -la .next/standalone/node_modules/.prisma/client/ | grep "engine"

