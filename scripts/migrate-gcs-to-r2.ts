#!/usr/bin/env node
/**
 * Script de migration d'images de Google Cloud Storage vers Cloudflare R2
 *
 * Usage:
 *   npm exec tsx scripts/migrate-gcs-to-r2.ts
 *
 * Variables d'environnement requises:
 *   - GOOGLE_PROJECT_ID: Project ID Google Cloud
 *   - GOOGLE_PRIVATE_KEY: Clé privée du service account Google
 *   - GOOGLE_CLIENT_EMAIL: Email du service account Google
 *   - GCS_BUCKET: Nom du bucket Google Cloud Storage
 *   - R2_ACCOUNT_ID: Account ID Cloudflare R2
 *   - R2_ACCESS_KEY_ID: Access Key ID Cloudflare R2
 *   - R2_SECRET_ACCESS_KEY: Secret Access Key Cloudflare R2
 *   - R2_BUCKET: Nom du bucket Cloudflare R2
 *   - MIGRATION_LIST: Chemin vers le fichier JSON avec la liste d'images (default: scripts/migration-images.json)
 */

import { Storage } from "@google-cloud/storage";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import pLimit from "p-limit";

const DEFAULT_LIST_FILE = path.join(process.cwd(), "scripts/migration-images.json");
const CONCURRENT_LIMIT = 5;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

interface MigrationResult {
  path: string;
  success: boolean;
  error?: string;
  attempt?: number;
}

interface MigrationStats {
  total: number;
  success: number;
  failed: number;
  results: MigrationResult[];
}

// Lecture et validation des variables d'environnement
function validateEnv(): {
  googleProjectId: string;
  googlePrivateKey: string;
  googleClientEmail: string;
  gcsBucket: string;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2Bucket: string;
  listFile: string;
} {
  const required = [
    "GOOGLE_PROJECT_ID",
    "GOOGLE_PRIVATE_KEY",
    "GOOGLE_CLIENT_EMAIL",
    "GCS_BUCKET",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error("❌ Variables d'environnement manquantes:", missing.join(", "));
    process.exit(1);
  }

  return {
    googleProjectId: process.env.GOOGLE_PROJECT_ID!,
    googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
    gcsBucket: process.env.GCS_BUCKET!,
    r2AccountId: process.env.R2_ACCOUNT_ID!,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID!,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    r2Bucket: process.env.R2_BUCKET!,
    listFile: process.env.MIGRATION_LIST || DEFAULT_LIST_FILE,
  };
}

// Lecture de la liste d'images à migrer
function readMigrationList(filePath: string): string[] {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Fichier non trouvé: ${filePath}`);
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const list = JSON.parse(content);
    if (!Array.isArray(list)) {
      console.error("❌ Le fichier doit contenir un array JSON");
      process.exit(1);
    }
    return list;
  } catch (error) {
    console.error("❌ Erreur lors de la lecture du fichier:", error);
    process.exit(1);
  }
}

// Attendre avant retry
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Migration d'une image avec retry
async function migrateImage(
  imagePath: string,
  gcsStorage: Storage,
  gcsBucket: string,
  s3Client: S3Client,
  r2Bucket: string
): Promise<MigrationResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      // Télécharger depuis Google Cloud Storage
      const bucket = gcsStorage.bucket(gcsBucket);
      const file = bucket.file(imagePath);
      const [buffer] = await file.download();

      // Uploader vers Cloudflare R2
      await s3Client.send(
        new PutObjectCommand({
          Bucket: r2Bucket,
          Key: imagePath,
          Body: buffer,
          ContentType: getContentType(imagePath),
        })
      );

      return {
        path: imagePath,
        success: true,
        attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < RETRY_ATTEMPTS) {
        const waitTime = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(
          `⏳ Tentative ${attempt}/${RETRY_ATTEMPTS} échouée pour ${imagePath}, nouvel essai dans ${waitTime}ms...`
        );
        await delay(waitTime);
      }
    }
  }

  return {
    path: imagePath,
    success: false,
    error: lastError?.message || "Erreur inconnue",
    attempt: RETRY_ATTEMPTS,
  };
}

// Déterminer le Content-Type basé sur l'extension
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// Afficher un résumé avec barre de progression
function printProgress(current: number, total: number, message: string): void {
  const percentage = Math.round((current / total) * 100);
  const barLength = 30;
  const filledLength = Math.round((percentage / 100) * barLength);
  const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);
  console.log(`[${bar}] ${percentage}% - ${message}`);
}

// Fonction principale
async function main() {
  const config = validateEnv();
  const imagePaths = readMigrationList(config.listFile);

  if (imagePaths.length === 0) {
    console.log("⚠️  Aucune image à migrer");
    return;
  }

  console.log("\n📦 Migration d'images GCS → R2");
  console.log(`📊 ${imagePaths.length} image(s) à migrer`);
  console.log(`📂 Source: gs://${config.gcsBucket}`);
  console.log(`📂 Destination: s3://${config.r2Bucket}\n`);

  // Initialiser Google Cloud Storage
  const gcsStorage = new Storage({
    projectId: config.googleProjectId,
    credentials: {
      type: "service_account",
      project_id: config.googleProjectId,
      private_key: config.googlePrivateKey,
      client_email: config.googleClientEmail,
    } as any,
  });

  // Initialiser Cloudflare R2
  const s3Client = new S3Client({
    region: "auto",
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    },
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
  });

  const stats: MigrationStats = {
    total: imagePaths.length,
    success: 0,
    failed: 0,
    results: [],
  };

  // Migration avec limite de concurrence
  const limit = pLimit(CONCURRENT_LIMIT);
  const promises = imagePaths.map((imagePath, index) =>
    limit(async () => {
      const result = await migrateImage(
        imagePath,
        gcsStorage,
        config.gcsBucket,
        s3Client,
        config.r2Bucket
      );

      if (result.success) {
        stats.success++;
        printProgress(
          stats.success + stats.failed,
          stats.total,
          `✅ ${imagePath}`
        );
      } else {
        stats.failed++;
        printProgress(
          stats.success + stats.failed,
          stats.total,
          `❌ ${imagePath} - ${result.error}`
        );
      }

      stats.results.push(result);
      return result;
    })
  );

  await Promise.all(promises);

  // Afficher le résumé
  console.log("\n📈 Résumé de la migration:");
  console.log(`  ✅ Succès: ${stats.success}/${stats.total}`);
  console.log(`  ❌ Échecs: ${stats.failed}/${stats.total}`);

  if (stats.failed > 0) {
    console.log("\n⚠️  Images échouées:");
    stats.results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.path}: ${r.error}`);
      });
  }

  // Sauvegarder le rapport
  const reportPath = path.join(process.cwd(), "migration-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2));
  console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);

  process.exit(stats.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});
