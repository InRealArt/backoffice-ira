#!/usr/bin/env node
/**
 * Audit de synchronisation GCS → R2
 *
 * Scanne récursivement tous les fichiers du bucket Google Cloud Storage (source)
 * et vérifie leur présence dans Cloudflare R2 (cible).
 * Produit un rapport JSON + résumé console des fichiers manquants.
 *
 * Usage:
 *   npm exec tsx scripts/sync-audit-gcs-to-r2.ts
 *   npm exec tsx scripts/sync-audit-gcs-to-r2.ts --output=reports/missing-files.json
 *   npm exec tsx scripts/sync-audit-gcs-to-r2.ts --concurrency=50
 *
 * Variables d'environnement (fichier .env.migration) :
 *   GOOGLE_PROJECT_ID, GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL, GCS_BUCKET
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 */

import { Storage } from "@google-cloud/storage";
import {
  S3Client,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const outputArg = args.find((a) => a.startsWith("--output="));
const concurrencyArg = args.find((a) => a.startsWith("--concurrency="));
const OUTPUT_FILE = outputArg
  ? outputArg.split("=")[1]
  : `reports/missing-files-${new Date().toISOString().slice(0, 10)}.json`;
const CONCURRENCY = concurrencyArg ? parseInt(concurrencyArg.split("=")[1], 10) : 50;

// ---------------------------------------------------------------------------
// Load .env.migration
// ---------------------------------------------------------------------------
function loadEnv(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv(path.join(process.cwd(), ".env.migration"));
loadEnv(path.join(process.cwd(), ".env.local"));

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const config = {
  googleProjectId: process.env.GOOGLE_PROJECT_ID!,
  googlePrivateKey: (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
  gcsBucket: process.env.GCS_BUCKET!,
  r2AccountId: process.env.R2_ACCOUNT_ID!,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID!,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  r2Bucket: process.env.R2_BUCKET ?? process.env.R2_BUCKET_NAME!,
};

for (const [k, v] of Object.entries(config)) {
  if (!v) {
    console.error(`❌ Variable manquante : ${k}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
const gcs = new Storage({
  projectId: config.googleProjectId,
  credentials: {
    type: "service_account",
    project_id: config.googleProjectId,
    private_key: config.googlePrivateKey,
    client_email: config.googleClientEmail,
  } as never,
});

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
  },
});

// ---------------------------------------------------------------------------
// Video extensions to skip
// ---------------------------------------------------------------------------
const VIDEO_EXTENSIONS = new Set([
  "mp4", "mov", "avi", "webm", "mkv", "flv", "wmv", "m4v",
  "mpeg", "mpg", "3gp", "ogv", "ts", "m2ts", "gif",
]);

const EXCLUDED_PREFIXES = ["presale/dropPanel"];

function isVideo(key: string): boolean {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXTENSIONS.has(ext);
}

function isExcluded(key: string): boolean {
  return EXCLUDED_PREFIXES.some((prefix) => key.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// List all objects in GCS (recursive)
// ---------------------------------------------------------------------------
async function listGcsFiles(): Promise<{ included: string[]; excluded: string[] }> {
  console.log(`📦 Listing GCS bucket: ${config.gcsBucket} …`);
  const [files] = await gcs.bucket(config.gcsBucket).getFiles();
  const included: string[] = [];
  const excluded: string[] = [];
  for (const f of files) {
    if (f.name.endsWith("/")) continue;
    if (isVideo(f.name) || isExcluded(f.name)) {
      excluded.push(f.name);
    } else {
      included.push(f.name);
    }
  }
  console.log(`   → ${included.length.toLocaleString()} fichiers inclus, ${excluded.length.toLocaleString()} omis (vidéos + presale/dropPanel)`);
  return { included, excluded };
}

// ---------------------------------------------------------------------------
// List all objects in R2 (paginated)
// ---------------------------------------------------------------------------
async function listR2Files(): Promise<Set<string>> {
  console.log(`☁️  Listing R2 bucket: ${config.r2Bucket} …`);
  const keys = new Set<string>();
  let continuationToken: string | undefined;

  do {
    const resp: ListObjectsV2CommandOutput = await r2.send(
      new ListObjectsV2Command({
        Bucket: config.r2Bucket,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      })
    );

    for (const obj of resp.Contents ?? []) {
      if (obj.Key) keys.add(obj.Key);
    }

    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`   → ${keys.size.toLocaleString()} fichiers trouvés dans R2`);
  return keys;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("\n🔍 Audit de synchronisation GCS → R2\n");
  const startTime = Date.now();

  // List both buckets in parallel
  const [{ included: gcsFiles, excluded: gcsExcluded }, r2Files] = await Promise.all([listGcsFiles(), listR2Files()]);

  // Show excluded files
  if (gcsExcluded.length > 0) {
    console.log(`\n⚠️  Fichiers omis (${gcsExcluded.length}) — vidéos et presale/dropPanel :`);
    gcsExcluded.slice(0, 20).forEach((f) => console.log(`   ${f}`));
    if (gcsExcluded.length > 20) console.log(`   … et ${gcsExcluded.length - 20} autres`);
  }

  // Find missing files
  console.log("\n⚡ Comparaison en cours …");
  const missing: string[] = [];
  const present: string[] = [];

  for (const key of gcsFiles) {
    if (r2Files.has(key)) {
      present.push(key);
    } else {
      missing.push(key);
    }
  }

  // Sort for readability
  missing.sort();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // ---------------------------------------------------------------------------
  // Console summary
  // ---------------------------------------------------------------------------
  console.log("\n" + "=".repeat(60));
  console.log("📊 RÉSULTAT");
  console.log("=".repeat(60));
  console.log(`  GCS inclus    : ${gcsFiles.length.toLocaleString()} fichiers`);
  console.log(`  GCS omis      : ${gcsExcluded.length.toLocaleString()} fichiers`);
  console.log(`  R2 total      : ${r2Files.size.toLocaleString()} fichiers`);
  console.log(`  ✅ Présents    : ${present.length.toLocaleString()} fichiers`);
  console.log(`  ❌ Manquants   : ${missing.length.toLocaleString()} fichiers`);
  console.log(`  ⏱  Durée       : ${elapsed}s`);
  console.log("=".repeat(60));

  if (missing.length > 0) {
    console.log("\n❌ Premiers fichiers manquants (max 20) :");
    missing.slice(0, 20).forEach((f) => console.log(`   ${f}`));
    if (missing.length > 20) {
      console.log(`   … et ${missing.length - 20} autres (voir rapport JSON)`);
    }
  } else {
    console.log("\n✅ Les deux buckets sont synchronisés !");
  }

  // ---------------------------------------------------------------------------
  // Write JSON report
  // ---------------------------------------------------------------------------
  const reportDir = path.dirname(path.join(process.cwd(), OUTPUT_FILE));
  fs.mkdirSync(reportDir, { recursive: true });

  const report = {
    generatedAt: new Date().toISOString(),
    gcsBucket: config.gcsBucket,
    r2Bucket: config.r2Bucket,
    excludedPrefixes: EXCLUDED_PREFIXES,
    stats: {
      gcsIncluded: gcsFiles.length,
      gcsExcluded: gcsExcluded.length,
      r2Total: r2Files.size,
      present: present.length,
      missing: missing.length,
      elapsedSeconds: parseFloat(elapsed),
    },
    missingFiles: missing,
    excludedFiles: gcsExcluded,
  };

  fs.writeFileSync(
    path.join(process.cwd(), OUTPUT_FILE),
    JSON.stringify(report, null, 2),
    "utf-8"
  );

  console.log(`\n📄 Rapport complet écrit dans : ${OUTPUT_FILE}\n`);

  process.exit(missing.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("💥 Erreur fatale :", err);
  process.exit(2);
});
