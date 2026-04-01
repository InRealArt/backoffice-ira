#!/usr/bin/env node
/**
 * Copie vers R2 les fichiers manquants identifiés par l'audit sync-audit-gcs-to-r2.ts
 *
 * Usage:
 *   npm exec tsx scripts/sync-copy-missing-to-r2.ts
 *   npm exec tsx scripts/sync-copy-missing-to-r2.ts --report=reports/missing-files-2026-04-01.json
 *   npm exec tsx scripts/sync-copy-missing-to-r2.ts --concurrency=20
 *   npm exec tsx scripts/sync-copy-missing-to-r2.ts --dry-run
 *
 * Variables d'environnement (fichier .env.migration) :
 *   GOOGLE_PROJECT_ID, GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL, GCS_BUCKET
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 */

import { Storage } from "@google-cloud/storage";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import pLimit from "p-limit";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const reportArg = args.find((a) => a.startsWith("--report="));
const concurrencyArg = args.find((a) => a.startsWith("--concurrency="));
const DRY_RUN = args.includes("--dry-run");
const CONCURRENCY = concurrencyArg ? parseInt(concurrencyArg.split("=")[1], 10) : 10;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 1000;

// ---------------------------------------------------------------------------
// Load .env.migration then .env.local (same pattern as audit script)
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

// Ignore EPIPE errors (broken pipe when output is piped to head/less)
process.stdout.on("error", (err) => { if ((err as NodeJS.ErrnoException).code !== "EPIPE") throw err; });
process.stderr.on("error", (err) => { if ((err as NodeJS.ErrnoException).code !== "EPIPE") throw err; });

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
    process.exit(2);
  }
}

// ---------------------------------------------------------------------------
// Report format (produced by sync-audit-gcs-to-r2.ts)
// ---------------------------------------------------------------------------
interface AuditReport {
  generatedAt: string;
  gcsBucket: string;
  r2Bucket: string;
  stats: {
    gcsTotal: number;
    r2Total: number;
    present: number;
    missing: number;
    elapsedSeconds: number;
  };
  missingFiles: string[];
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------
interface CopyResult {
  path: string;
  success: boolean;
  error?: string;
  attempt?: number;
}

interface SyncReport {
  generatedAt: string;
  gcsBucket: string;
  r2Bucket: string;
  dryRun: boolean;
  stats: {
    total: number;
    success: number;
    failed: number;
    elapsedSeconds: number;
  };
  succeeded: string[];
  failed: Array<{ path: string; error: string }>;
}

// ---------------------------------------------------------------------------
// Resolve the report file to use
// ---------------------------------------------------------------------------
function resolveReportPath(): string {
  if (reportArg) {
    const p = reportArg.split("=")[1];
    // Accept absolute or relative paths
    return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  }

  // Default: find the latest missing-files-*.json in reports/
  const reportsDir = path.join(process.cwd(), "reports");
  if (!fs.existsSync(reportsDir)) {
    console.error(`❌ Dossier reports/ introuvable et aucun --report= fourni`);
    process.exit(2);
  }

  const candidates = fs
    .readdirSync(reportsDir)
    .filter((f) => /^missing-files-.+\.json$/.test(f))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(reportsDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (candidates.length === 0) {
    console.error(`❌ Aucun fichier missing-files-*.json dans reports/ — utilisez --report=<chemin>`);
    process.exit(2);
  }

  return path.join(reportsDir, candidates[0].name);
}

// ---------------------------------------------------------------------------
// Load and validate the audit report
// ---------------------------------------------------------------------------
function loadAuditReport(filePath: string): AuditReport {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Rapport introuvable : ${filePath}`);
    process.exit(2);
  }

  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    console.error(`❌ Impossible de parser le rapport JSON : ${err}`);
    process.exit(2);
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !Array.isArray((data as AuditReport).missingFiles)
  ) {
    console.error(`❌ Format de rapport invalide — champ missingFiles manquant`);
    process.exit(2);
  }

  return data as AuditReport;
}

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
// Content-Type from extension
// ---------------------------------------------------------------------------
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".mp4": "video/mp4",
    ".json": "application/json",
    ".txt": "text/plain",
  };
  return map[ext] ?? "application/octet-stream";
}

// ---------------------------------------------------------------------------
// Delay helper
// ---------------------------------------------------------------------------
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Progress line (right-align the counter for alignment up to 9999 files)
// ---------------------------------------------------------------------------
function formatCounter(current: number, total: number): string {
  const width = String(total).length;
  return `[${String(current).padStart(width)}/${total}]`;
}

// ---------------------------------------------------------------------------
// Copy a single file from GCS to R2 with retry + exponential backoff
// ---------------------------------------------------------------------------
async function copyFile(
  filePath: string,
  gcs: Storage,
  s3: S3Client
): Promise<CopyResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const gcsFile = gcs.bucket(config.gcsBucket).file(filePath);

      // Timeout wrapper — GCS download can hang indefinitely without one
      const downloadWithTimeout = () =>
        Promise.race([
          gcsFile.download(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("GCS download timeout (30s)")), 30_000)
          ),
        ]);

      const [buffer] = await downloadWithTimeout();

      await s3.send(
        new PutObjectCommand({
          Bucket: config.r2Bucket,
          Key: filePath,
          Body: buffer,
          ContentLength: buffer.length,
          ContentType: getContentType(filePath),
        })
      );

      return { path: filePath, success: true, attempt };
    } catch (err) {
      // Capture full error details including code/status for empty-message errors
      const e = err instanceof Error ? err : new Error(String(err));
      const extra = (err as NodeJS.ErrnoException).code ?? (err as { status?: number }).status ?? "";
      lastError = extra ? new Error(`${e.message || "(no message)"} [${extra}]`) : e;

      if (attempt < RETRY_ATTEMPTS) {
        const waitMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
        await delay(waitMs);
      }
    }
  }

  return {
    path: filePath,
    success: false,
    error: lastError?.message ?? "Erreur inconnue",
    attempt: RETRY_ATTEMPTS,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const reportPath = resolveReportPath();
  const report = loadAuditReport(reportPath);
  const { gcsBucket, r2Bucket } = report;
  const skipped = report.missingFiles.filter((f) => isVideo(f) || isExcluded(f));
  const missingFiles = report.missingFiles.filter((f) => !isVideo(f) && !isExcluded(f));
  const total = missingFiles.length;

  console.log("\n📋 Copie des fichiers manquants GCS → R2");
  console.log(`   Rapport source : ${reportPath}`);
  console.log(`   GCS bucket     : ${gcsBucket}`);
  console.log(`   R2 bucket      : ${r2Bucket}`);
  console.log(`   Fichiers       : ${total}`);
  if (skipped.length > 0) {
    console.log(`   Omis           : ${skipped.length} (vidéos + presale/dropPanel)`);
    skipped.forEach((f) => console.log(`     ⊘ ${f}`));
  }
  console.log(`   Concurrence    : ${CONCURRENCY}`);
  if (DRY_RUN) console.log("   Mode           : DRY-RUN (aucune écriture)");
  console.log("");

  if (total === 0) {
    console.log("✅ Aucun fichier manquant — les buckets sont déjà synchronisés.");
    return;
  }

  if (DRY_RUN) {
    console.log(`Les ${total} fichiers suivants seraient copiés :\n`);
    missingFiles.forEach((f, i) => console.log(`  ${formatCounter(i + 1, total)} ${f}`));
    console.log("\nDry-run terminé — aucun fichier n'a été transféré.");
    return;
  }

  // Initialize clients
  const gcs = new Storage({
    projectId: config.googleProjectId,
    credentials: {
      type: "service_account",
      project_id: config.googleProjectId,
      private_key: config.googlePrivateKey,
      client_email: config.googleClientEmail,
    } as never,
  });

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    },
  });

  const startTime = Date.now();
  const results: CopyResult[] = [];
  let completed = 0;

  const limit = pLimit(CONCURRENCY);

  const promises = missingFiles.map((filePath) =>
    limit(async () => {
      const result = await copyFile(filePath, gcs, s3);
      completed++;

      const counter = formatCounter(completed, total);
      if (result.success) {
        console.log(`${counter} ✅ ${filePath}`);
      } else {
        console.log(
          `${counter} ❌ ${filePath} (attempt ${result.attempt}: ${result.error})`
        );
      }

      results.push(result);
      return result;
    })
  );

  await Promise.all(promises);

  const elapsedSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));
  const succeeded = results.filter((r) => r.success).map((r) => r.path);
  const failed = results
    .filter((r) => !r.success)
    .map((r) => ({ path: r.path, error: r.error ?? "Erreur inconnue" }));

  // ---------------------------------------------------------------------------
  // Console summary
  // ---------------------------------------------------------------------------
  console.log("\n" + "=".repeat(60));
  console.log("📊 RÉSUMÉ");
  console.log("=".repeat(60));
  console.log(`  Total      : ${total}`);
  console.log(`  ✅ Succès  : ${succeeded.length}`);
  console.log(`  ❌ Échecs  : ${failed.length}`);
  console.log(`  ⏱  Durée   : ${elapsedSeconds}s`);
  console.log("=".repeat(60));

  if (failed.length > 0) {
    console.log("\nFichiers en échec :");
    failed.forEach((f) => console.log(`  - ${f.path}: ${f.error}`));
  }

  // ---------------------------------------------------------------------------
  // Write JSON report
  // ---------------------------------------------------------------------------
  const now = new Date();
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "-",
    String(now.getHours()).padStart(2, "0"),
    "-",
    String(now.getMinutes()).padStart(2, "0"),
  ].join("");

  const outputFileName = `sync-copy-${ts}.json`;
  const reportsDir = path.join(process.cwd(), "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const outputPath = path.join(reportsDir, outputFileName);

  const syncReport: SyncReport = {
    generatedAt: now.toISOString(),
    gcsBucket,
    r2Bucket,
    dryRun: false,
    stats: { total, success: succeeded.length, failed: failed.length, elapsedSeconds },
    succeeded,
    failed,
  };

  fs.writeFileSync(outputPath, JSON.stringify(syncReport, null, 2), "utf-8");
  console.log(`\n📄 Rapport écrit dans : reports/${outputFileName}\n`);

  process.exit(failed.length > 0 ? 1 : 0);
}

// Catch unhandled EPIPE from underlying TLS sockets (GCS/R2 network interruptions)
process.on("uncaughtException", (err) => {
  if ((err as NodeJS.ErrnoException).code === "EPIPE") return; // ignore, handled per-file via retry
  console.error("💥 Erreur fatale :", err);
  process.exit(2);
});

main().catch((err) => {
  console.error("💥 Erreur fatale :", err);
  process.exit(2);
});
