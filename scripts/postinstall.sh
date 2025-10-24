#!/bin/bash

# Script postinstall pour Prisma sur Vercel
echo "🔧 Génération du client Prisma..."

# Vérifier si nous sommes sur Vercel
if [ -n "$VERCEL" ]; then
  echo "📦 Déploiement Vercel détecté"
  npx prisma generate
else
  echo "💻 Environnement local détecté"
  npx prisma generate
fi

echo "✅ Client Prisma généré avec succès"

