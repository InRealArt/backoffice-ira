#!/bin/bash

# Script pour copier les moteurs Prisma dans le build standalone
# Nécessaire pour le déploiement sur Vercel avec Next.js 16

set -e  # Arrêter en cas d'erreur

echo "🔧 Copie des moteurs Prisma dans le build standalone..."

# Vérifier si le dossier standalone existe
if [ ! -d ".next/standalone" ]; then
  echo "⚠️  Le dossier .next/standalone n'existe pas. Exécutez 'npm run build' d'abord."
  exit 0
fi

# Vérifier que les moteurs Prisma existent dans node_modules
if [ ! -d "node_modules/.prisma/client" ]; then
  echo "❌ Erreur: node_modules/.prisma/client n'existe pas. Exécutez 'npx prisma generate' d'abord."
  exit 1
fi

# Créer le dossier de destination
mkdir -p .next/standalone/node_modules/.prisma/client

# Copier tous les moteurs Prisma (avec vérification)
if ! cp -r node_modules/.prisma/client/* .next/standalone/node_modules/.prisma/client/ 2>/dev/null; then
  echo "❌ Erreur lors de la copie des moteurs Prisma"
  exit 1
fi

# Copier aussi @prisma/client
mkdir -p .next/standalone/node_modules/@prisma
if ! cp -r node_modules/@prisma/client .next/standalone/node_modules/@prisma/ 2>/dev/null; then
  echo "❌ Erreur lors de la copie de @prisma/client"
  exit 1
fi

# Vérifier que le binaire rhel-openssl-3.0.x est présent
if [ ! -f ".next/standalone/node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node" ]; then
  echo "⚠️  Attention: libquery_engine-rhel-openssl-3.0.x.so.node n'a pas été copié"
  echo "📋 Liste des fichiers présents:"
  ls -la .next/standalone/node_modules/.prisma/client/ | grep "engine" || echo "Aucun fichier engine trouvé"
else
  echo "✅ Binaire rhel-openssl-3.0.x vérifié"
fi

echo "✅ Moteurs Prisma copiés avec succès dans .next/standalone"
echo "📦 Fichiers copiés :"
ls -lh .next/standalone/node_modules/.prisma/client/ | grep -E "(engine|rhel)" || echo "Aucun fichier trouvé"

