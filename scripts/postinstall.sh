#!/bin/bash
set -e

echo "🔧 Génération du client Prisma..."
npx prisma generate
echo "✅ Client Prisma généré avec succès"
