#!/usr/bin/env node
/**
 * migrate-db.ts
 *
 * Migration PostgreSQL vers PostgreSQL — copie de toutes les données
 * table par table, en respectant l'ordre topologique des dépendances FK.
 *
 * Usage:
 *   tsx scripts/migrate-db.ts [--schemas=public,landing,...] [--dry-run] [--batch=500]
 *
 * Variables d'environnement (fichier .env.migration ou export) :
 *   SOURCE_DATABASE_URL   — URL de la DB source (postgresql://...)
 *   TARGET_DATABASE_URL   — URL de la DB cible (postgresql://...)
 *
 * Mode:
 *   upsert (seul mode autorisé) — INSERT ON CONFLICT DO UPDATE (préserve les données cible)
 *
 * Exemples:
 *   tsx scripts/migrate-db.ts
 *   tsx scripts/migrate-db.ts --schemas=public,landing,backoffice
 *   tsx scripts/migrate-db.ts --dry-run
 *   tsx scripts/migrate-db.ts --batch=1000
 */

import { Pool, PoolClient } from "pg";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Env loading (même pattern que les autres scripts du projet)
// ---------------------------------------------------------------------------
function loadEnv(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const CWD = process.cwd();
loadEnv(path.join(CWD, ".env.migration"));
loadEnv(path.join(CWD, ".env.local"));
loadEnv(path.join(CWD, ".env"));

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split("=").slice(1).join("=") : undefined;
}

const MODE = "upsert" as const;
const DRY_RUN = args.includes("--dry-run");
const BATCH_SIZE = parseInt(getArg("batch") ?? "500", 10);
const REQUESTED_SCHEMAS = getArg("schemas")?.split(",").map((s) => s.trim());

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SOURCE_URL = process.env.SOURCE_DATABASE_URL;
const TARGET_URL = process.env.TARGET_DATABASE_URL;

if (!SOURCE_URL) {
  console.error("[ERROR] Variable SOURCE_DATABASE_URL manquante.");
  console.error("  Définissez-la dans .env.migration ou exportez-la.");
  process.exit(1);
}
if (!TARGET_URL) {
  console.error("[ERROR] Variable TARGET_DATABASE_URL manquante.");
  console.error("  Définissez-la dans .env.migration ou exportez-la.");
  process.exit(1);
}

// Schémas définis dans le schema.prisma du projet
const ALL_SCHEMAS = [
  "public",
  "auth",
  "landing",
  "marketplace",
  "blockchain",
  "landingUi",
  "landingUgc",
  "backoffice",
  "statistics",
];

const SCHEMAS_TO_MIGRATE = REQUESTED_SCHEMAS ?? ALL_SCHEMAS;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TableInfo {
  schema: string;
  table: string;
  qualifiedName: string; // schema.table
  columns: ColumnInfo[];
  primaryKeys: string[];
  foreignKeys: ForeignKeyInfo[];
}

interface ColumnInfo {
  name: string;
  dataType: string;
  udtName: string;
  isNullable: boolean;
}

interface ForeignKeyInfo {
  constraintName: string;
  columns: string[];
  referencedSchema: string;
  referencedTable: string;
  referencedColumns: string[];
}

interface RowError {
  pkValues: Record<string, unknown>;
  error: string;
}

interface MigrationStats {
  table: string;
  rowsRead: number;
  rowsWritten: number;
  rowErrors: RowError[];
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";

function log(msg: string): void {
  console.log(msg);
}

function logInfo(msg: string): void {
  console.log(`${CYAN}[INFO]${RESET} ${msg}`);
}

function logSuccess(msg: string): void {
  console.log(`${GREEN}[OK]${RESET}   ${msg}`);
}

function logWarn(msg: string): void {
  console.warn(`${YELLOW}[WARN]${RESET} ${msg}`);
}

function logError(msg: string): void {
  console.error(`${RED}[ERROR]${RESET} ${msg}`);
}

function logDry(msg: string): void {
  console.log(`${DIM}[DRY]${RESET}  ${msg}`);
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatRows(n: number): string {
  return n.toLocaleString("fr-FR");
}

// ---------------------------------------------------------------------------
// Introspection de la base source
// ---------------------------------------------------------------------------
async function fetchTables(client: PoolClient, schemas: string[]): Promise<TableInfo[]> {
  // Récupère toutes les tables (hors vues, hors tables système)
  const { rows } = await client.query<{ table_schema: string; table_name: string }>(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_schema = ANY($1::text[])
    ORDER BY table_schema, table_name
  `, [schemas]);

  const tables: TableInfo[] = [];

  for (const row of rows) {
    const schema = row.table_schema;
    const table = row.table_name;
    const qualifiedName = `"${schema}"."${table}"`;

    // Colonnes
    const colRes = await client.query<{
      column_name: string;
      data_type: string;
      udt_name: string;
      is_nullable: string;
    }>(`
      SELECT column_name, data_type, udt_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `, [schema, table]);

    const columns: ColumnInfo[] = colRes.rows.map((c) => ({
      name: c.column_name,
      dataType: c.data_type,
      udtName: c.udt_name,
      isNullable: c.is_nullable === "YES",
    }));

    // Clés primaires
    const pkRes = await client.query<{ column_name: string }>(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
      ORDER BY kcu.ordinal_position
    `, [schema, table]);

    const primaryKeys = pkRes.rows.map((r) => r.column_name);

    // Clés étrangères
    const fkRes = await client.query<{
      constraint_name: string;
      column_name: string;
      foreign_table_schema: string;
      foreign_table_name: string;
      foreign_column_name: string;
    }>(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name   AS foreign_table_name,
        ccu.column_name  AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
      ORDER BY tc.constraint_name, kcu.ordinal_position
    `, [schema, table]);

    // Regroupe les FK par constraint_name
    const fkMap = new Map<string, ForeignKeyInfo>();
    for (const fk of fkRes.rows) {
      if (!fkMap.has(fk.constraint_name)) {
        fkMap.set(fk.constraint_name, {
          constraintName: fk.constraint_name,
          columns: [],
          referencedSchema: fk.foreign_table_schema,
          referencedTable: fk.foreign_table_name,
          referencedColumns: [],
        });
      }
      const entry = fkMap.get(fk.constraint_name)!;
      entry.columns.push(fk.column_name);
      entry.referencedColumns.push(fk.foreign_column_name);
    }

    tables.push({
      schema,
      table,
      qualifiedName,
      columns,
      primaryKeys,
      foreignKeys: Array.from(fkMap.values()),
    });
  }

  return tables;
}

// ---------------------------------------------------------------------------
// Tri topologique (Kahn's algorithm)
// ---------------------------------------------------------------------------
function topologicalSort(tables: TableInfo[]): TableInfo[] {
  const tableMap = new Map<string, TableInfo>();
  for (const t of tables) {
    tableMap.set(`${t.schema}.${t.table}`, t);
  }

  // Graphe de dépendances : table A dépend de table B si A a une FK vers B
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // B -> liste de tables dépendant de B

  for (const t of tables) {
    const key = `${t.schema}.${t.table}`;
    if (!inDegree.has(key)) inDegree.set(key, 0);
    if (!dependents.has(key)) dependents.set(key, []);
  }

  for (const t of tables) {
    const key = `${t.schema}.${t.table}`;
    const seenDeps = new Set<string>();

    for (const fk of t.foreignKeys) {
      const depKey = `${fk.referencedSchema}.${fk.referencedTable}`;
      // Ignore les auto-références et les tables hors périmètre
      if (depKey === key || !tableMap.has(depKey)) continue;
      if (seenDeps.has(depKey)) continue;
      seenDeps.add(depKey);

      inDegree.set(key, (inDegree.get(key) ?? 0) + 1);
      dependents.get(depKey)!.push(key);
    }
  }

  // Queue avec toutes les tables sans dépendances
  const queue: string[] = [];
  for (const [key, deg] of inDegree) {
    if (deg === 0) queue.push(key);
  }

  const sorted: TableInfo[] = [];
  while (queue.length > 0) {
    const key = queue.shift()!;
    const table = tableMap.get(key);
    if (table) sorted.push(table);

    for (const dep of dependents.get(key) ?? []) {
      const newDeg = (inDegree.get(dep) ?? 1) - 1;
      inDegree.set(dep, newDeg);
      if (newDeg === 0) queue.push(dep);
    }
  }

  // Tables restantes (cycles) — on les ajoute à la fin avec un avertissement
  const remaining = tables.filter(
    (t) => !sorted.find((s) => s.schema === t.schema && s.table === t.table)
  );
  if (remaining.length > 0) {
    logWarn(
      `Cycles FK détectés pour ${remaining.length} table(s) — elles seront migrées en dernier avec FK désactivées:`
    );
    for (const t of remaining) {
      logWarn(`  - ${t.qualifiedName}`);
    }
  }

  return [...sorted, ...remaining];
}

// ---------------------------------------------------------------------------
// Migration d'une table
// ---------------------------------------------------------------------------
async function migrateTable(
  sourceClient: PoolClient,
  targetClient: PoolClient,
  table: TableInfo,
  dryRun: boolean
): Promise<MigrationStats> {
  const start = Date.now();
  const { qualifiedName, columns, primaryKeys } = table;

  const stats: MigrationStats = {
    table: qualifiedName,
    rowsRead: 0,
    rowsWritten: 0,
    rowErrors: [],
    durationMs: 0,
  };

  try {
    // Compte les lignes source
    const countRes = await sourceClient.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${qualifiedName}`
    );
    const totalRows = parseInt(countRes.rows[0].count, 10);
    stats.rowsRead = totalRows;

    if (totalRows === 0) {
      stats.durationMs = Date.now() - start;
      return stats;
    }

    if (dryRun) {
      logDry(`  ${qualifiedName}: ${formatRows(totalRows)} lignes (dry-run, aucune écriture)`);
      stats.durationMs = Date.now() - start;
      return stats;
    }

    // Construction de la requête INSERT (upsert uniquement)
    const colNames = columns.map((c) => `"${c.name}"`).join(", ");
    const colPlaceholders = columns
      .map((_, i) => `$${i + 1}`)
      .join(", ");

    let insertSQL: string;
    if (primaryKeys.length > 0) {
      const pkConflict = primaryKeys.map((pk) => `"${pk}"`).join(", ");
      const updateSet = columns
        .filter((c) => !primaryKeys.includes(c.name))
        .map((c) => `"${c.name}" = EXCLUDED."${c.name}"`)
        .join(", ");

      if (updateSet) {
        insertSQL = `
          INSERT INTO ${qualifiedName} (${colNames})
          VALUES (${colPlaceholders})
          ON CONFLICT (${pkConflict}) DO UPDATE SET ${updateSet}
        `;
      } else {
        // Table de jointure pure (PK composite seulement)
        insertSQL = `
          INSERT INTO ${qualifiedName} (${colNames})
          VALUES (${colPlaceholders})
          ON CONFLICT (${pkConflict}) DO NOTHING
        `;
      }
    } else {
      insertSQL = `
        INSERT INTO ${qualifiedName} (${colNames})
        VALUES (${colPlaceholders})
        ON CONFLICT DO NOTHING
      `;
    }

    // Détecte une FK auto-référencée (table qui pointe vers elle-même)
    const selfFk = table.foreignKeys.find(
      (fk) => fk.referencedSchema === table.schema && fk.referencedTable === table.table
    );

    // Pour les tables auto-référencées : tri topologique interne des lignes
    // (parents avant enfants) via une CTE récursive PostgreSQL
    let orderedRows: Record<string, unknown>[] = [];
    if (selfFk && primaryKeys.length > 0) {
      const pkCol = primaryKeys[0];
      const fkCol = selfFk.columns[0];
      try {
        // Charge toutes les lignes triées par profondeur hiérarchique
        const hierarchyRes = await sourceClient.query(`
          WITH RECURSIVE ordered AS (
            -- Racines : lignes sans parent (fk = NULL ou fk = propre id)
            SELECT *, 0 AS _depth
            FROM ${qualifiedName}
            WHERE "${fkCol}" IS NULL OR "${fkCol}" = "${pkCol}"
            UNION ALL
            -- Enfants récursifs
            SELECT child.*, parent._depth + 1
            FROM ${qualifiedName} child
            JOIN ordered parent ON child."${fkCol}" = parent."${pkCol}"
            WHERE child."${fkCol}" != child."${pkCol}"
          )
          SELECT * FROM ordered ORDER BY _depth
        `);
        // Déduplique (la CTE peut retourner des doublons)
        const seen = new Set<unknown>();
        for (const row of hierarchyRes.rows) {
          if (!seen.has(row[pkCol])) {
            seen.add(row[pkCol]);
            orderedRows.push(row);
          }
        }
        // Lignes orphelines non atteignables par la CTE (FK cassée en source)
        const allRes = await sourceClient.query(`SELECT * FROM ${qualifiedName}`);
        for (const row of allRes.rows) {
          if (!seen.has(row[pkCol])) {
            orderedRows.push(row);
          }
        }
        logInfo(`  Auto-référence détectée (${fkCol} → ${pkCol}) — ${orderedRows.length} lignes triées hiérarchiquement.`);
      } catch {
        // Si la CTE récursive échoue (cycle infini, etc.), fallback lecture normale
        orderedRows = [];
      }
    }

    // Lecture par batch pour éviter de saturer la mémoire
    let offset = 0;
    while (offset < totalRows) {
      let batchRows: Record<string, unknown>[];

      if (orderedRows.length > 0) {
        // Table auto-référencée : utilise les lignes déjà triées
        batchRows = orderedRows.slice(offset, offset + BATCH_SIZE);
      } else {
        const batchRes = await sourceClient.query(
          `SELECT * FROM ${qualifiedName} ORDER BY (SELECT NULL) LIMIT $1 OFFSET $2`,
          [BATCH_SIZE, offset]
        );
        batchRows = batchRes.rows;
      }

      for (const row of batchRows) {
        const values = columns.map((col) => {
          const val = row[col.name];
          const isJsonCol = col.dataType === "json" || col.dataType === "jsonb";

          if (val === null || val === undefined) return val;

          if (isJsonCol) {
            // Fix 3 : si pg a déjà désérialisé en objet JS, re-sérialiser ;
            // si c'est déjà une string (double-encoded), la passer telle quelle
            if (typeof val === "string") return val;
            return JSON.stringify(val);
          }

          // Les arrays PostgreSQL sont déjà parsés par pg en JS Array — pas besoin de stringify
          // Les objets non-JSON (ex: hstore) sont sérialisés pour sécurité
          if (typeof val === "object" && !Array.isArray(val) && !(val instanceof Date) && !(val instanceof Buffer)) {
            return JSON.stringify(val);
          }
          return val;
        });

        // Fix 2 : insérer ligne par ligne et capturer les erreurs individuellement
        try {
          await targetClient.query(insertSQL, values);
          stats.rowsWritten++;
        } catch (rowErr) {
          const pkValues: Record<string, unknown> = {};
          for (const pk of primaryKeys) {
            pkValues[pk] = row[pk];
          }
          stats.rowErrors.push({
            pkValues,
            error: rowErr instanceof Error ? rowErr.message : String(rowErr),
          });
        }
      }

      offset += batchRows.length;
      if (batchRows.length < BATCH_SIZE) break;
    }
  } catch (err) {
    // Erreur fatale sur la table entière (ex: relation inexistante, pb de connexion)
    stats.rowErrors.push({
      pkValues: {},
      error: `[TABLE ERROR] ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  stats.durationMs = Date.now() - start;
  return stats;
}

// ---------------------------------------------------------------------------
// Gestion des séquences (auto-increment)
// ---------------------------------------------------------------------------
async function resetSequences(client: PoolClient, schemas: string[]): Promise<void> {
  logInfo("Réinitialisation des séquences...");

  const { rows } = await client.query<{
    sequence_schema: string;
    sequence_name: string;
  }>(`
    SELECT sequence_schema, sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = ANY($1::text[])
  `, [schemas]);

  for (const seq of rows) {
    const qualifiedSeq = `"${seq.sequence_schema}"."${seq.sequence_name}"`;
    // Identifie la table et colonne associée à la séquence
    const ownerRes = await client.query<{
      table_schema: string;
      table_name: string;
      column_name: string;
    }>(`
      SELECT
        n.nspname AS table_schema,
        c.relname AS table_name,
        a.attname AS column_name
      FROM pg_class s
      JOIN pg_depend d ON d.objid = s.oid
      JOIN pg_class c ON c.oid = d.refobjid
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.refobjsubid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE s.relkind = 'S'
        AND s.relname = $1
        AND n.nspname = $2
    `, [seq.sequence_name, seq.sequence_schema]);

    if (ownerRes.rows.length > 0) {
      const { table_schema, table_name, column_name } = ownerRes.rows[0];
      const qualifiedTable = `"${table_schema}"."${table_name}"`;
      try {
        await client.query(`
          SELECT setval(
            '${qualifiedSeq}',
            COALESCE((SELECT MAX("${column_name}") FROM ${qualifiedTable}), 1),
            true
          )
        `);
      } catch {
        // Ignore — la table peut être vide ou la séquence pas liée à une colonne simple
      }
    }
  }

  logSuccess("Séquences réinitialisées.");
}

// ---------------------------------------------------------------------------
// Point d'entrée principal
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const globalStart = Date.now();

  log(`\n${BOLD}=== Migration PostgreSQL → PostgreSQL ===${RESET}`);
  log(`Mode        : ${BOLD}upsert${RESET}${DRY_RUN ? ` ${YELLOW}(DRY-RUN)${RESET}` : ""}`);
  log(`Batch size  : ${BATCH_SIZE} lignes`);
  log(`Schémas     : ${SCHEMAS_TO_MIGRATE.join(", ")}`);
  log(`Source      : ${maskUrl(SOURCE_URL!)}`);
  log(`Cible       : ${maskUrl(TARGET_URL!)}`);
  log("");

  // SSL : Supabase PgBouncer (port 5432) utilise un certificat intermédiaire non vérifiable
  // NeonDB a un certificat valide — on peut activer la vérification complète
  function getSslOptions(url: string): { rejectUnauthorized: boolean } {
    return { rejectUnauthorized: !url.includes("supabase") };
  }

  // En dry-run, on ne se connecte qu'à la source
  const sourcePool = new Pool({ connectionString: SOURCE_URL!, ssl: getSslOptions(SOURCE_URL!) });
  const targetPool = DRY_RUN ? null : new Pool({ connectionString: TARGET_URL!, ssl: getSslOptions(TARGET_URL!) });

  let sourceClient: PoolClient | null = null;
  let targetClient: PoolClient | null = null;

  try {
    logInfo("Connexion à la DB source...");
    sourceClient = await sourcePool.connect();
    await sourceClient.query("SELECT 1");
    logSuccess("DB source connectée.");

    if (!DRY_RUN) {
      logInfo("Connexion à la DB cible...");
      targetClient = await targetPool!.connect();
      await targetClient.query("SELECT 1");
      logSuccess("DB cible connectée.");
    }

    // Introspection
    logInfo("Introspection du schéma source...");
    const tables = await fetchTables(sourceClient, SCHEMAS_TO_MIGRATE);
    logSuccess(`${tables.length} tables trouvées dans ${SCHEMAS_TO_MIGRATE.length} schéma(s).`);

    if (tables.length === 0) {
      logWarn("Aucune table trouvée. Vérifiez les noms de schémas.");
      return;
    }

    // Tri topologique
    logInfo("Calcul de l'ordre de migration (tri topologique FK)...");
    const sortedTables = topologicalSort(tables);
    log(`\n${DIM}Ordre de migration:${RESET}`);
    sortedTables.forEach((t, i) => {
      log(`  ${DIM}${String(i + 1).padStart(3)}.${RESET} ${t.qualifiedName}`);
    });
    log("");

    // En mode dry-run : affichage du résumé des tables AVANT toute opération cible
    if (DRY_RUN) {
      log(`\n${BOLD}${YELLOW}=== DRY-RUN — Résumé des tables à migrer ===${RESET}`);
      log(`${DIM}Aucune donnée ne sera écrite en cible.${RESET}\n`);

      const colW = Math.max(...sortedTables.map((t) => t.qualifiedName.length), 30);
      log(`${"#".padStart(4)}  ${"Table".padEnd(colW)}  ${"Lignes source".padStart(14)}  ${"Colonnes".padStart(8)}  ${"FKs".padStart(4)}`);
      log(`${"-".repeat(4)}  ${"-".repeat(colW)}  ${"-".repeat(14)}  ${"-".repeat(8)}  ${"-".repeat(4)}`);

      let totalRowsDry = 0;
      let totalColsDry = 0;

      for (let i = 0; i < sortedTables.length; i++) {
        const t = sortedTables[i];
        const countRes = await sourceClient.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM ${t.qualifiedName}`
        );
        const rowCount = parseInt(countRes.rows[0].count, 10);
        totalRowsDry += rowCount;
        totalColsDry += t.columns.length;
        const rowLabel = rowCount === 0 ? `${DIM}${"0".padStart(14)}${RESET}` : `${formatRows(rowCount).padStart(14)}`;
        log(
          `${String(i + 1).padStart(4)}  ${t.qualifiedName.padEnd(colW)}  ${rowLabel}  ${String(t.columns.length).padStart(8)}  ${String(t.foreignKeys.length).padStart(4)}`
        );
      }

      log(`${"-".repeat(4)}  ${"-".repeat(colW)}  ${"-".repeat(14)}  ${"-".repeat(8)}  ${"-".repeat(4)}`);
      log(
        `${"TOTAL".padStart(4)}  ${String(sortedTables.length + " tables").padEnd(colW)}  ${formatRows(totalRowsDry).padStart(14)}  ${String(totalColsDry).padStart(8)}`
      );
      log(`\n${YELLOW}(Dry-run: aucune donnée écrite — relancez sans --dry-run pour migrer)${RESET}\n`);
      return;
    }

    // Migration table par table
    const allStats: MigrationStats[] = [];
    let tableIndex = 0;

    // Désactivation des FK par table (ALTER TABLE DISABLE TRIGGER ALL)
    // NeonDB n'autorise pas session_replication_role, mais permet DISABLE TRIGGER ALL
    logInfo("Désactivation des triggers FK sur les tables cibles...");
    const disabledTables: string[] = [];
    for (const table of sortedTables) {
      try {
        await targetClient!.query(`ALTER TABLE ${table.qualifiedName} DISABLE TRIGGER ALL`);
        disabledTables.push(table.qualifiedName);
      } catch {
        // Table absente en cible ou droits insuffisants — ignoré, sera détecté à l'insertion
      }
    }
    logSuccess(`Triggers désactivés sur ${disabledTables.length} table(s).`);

    try {
      for (const table of sortedTables) {
        tableIndex++;
        const prefix = `[${String(tableIndex).padStart(3)}/${sortedTables.length}]`;
        process.stdout.write(`${CYAN}${prefix}${RESET} ${table.qualifiedName}... `);

        const stats = await migrateTable(sourceClient, targetClient!, table, DRY_RUN);
        allStats.push(stats);

        const hasFatalError = stats.rowErrors.some((e) => e.error.startsWith("[TABLE ERROR]"));
        const hasRowErrors = stats.rowErrors.length > 0;

        if (hasFatalError) {
          process.stdout.write(`${RED}ERREUR${RESET}\n`);
          for (const re of stats.rowErrors) {
            logError(`  ${re.error}`);
          }
        } else if (stats.rowsRead === 0) {
          process.stdout.write(`${DIM}vide${RESET}\n`);
        } else if (hasRowErrors) {
          process.stdout.write(
            `${YELLOW}${formatRows(stats.rowsWritten)}/${formatRows(stats.rowsRead)} lignes${RESET} ${DIM}(${formatDuration(stats.durationMs)}, ${stats.rowErrors.length} erreur(s))${RESET}\n`
          );
        } else {
          process.stdout.write(
            `${GREEN}${formatRows(stats.rowsWritten)} lignes${RESET} ${DIM}(${formatDuration(stats.durationMs)})${RESET}\n`
          );
        }
      }
    } finally {
      // Réactivation des triggers sur toutes les tables désactivées
      logInfo("Réactivation des triggers FK...");
      for (const qualifiedName of disabledTables) {
        try {
          await targetClient!.query(`ALTER TABLE ${qualifiedName} ENABLE TRIGGER ALL`);
        } catch {
          // Ignoré
        }
      }
      logSuccess("Triggers réactivés.");
    }

    // Réinitialisation des séquences
    if (!DRY_RUN) {
      await resetSequences(targetClient!, SCHEMAS_TO_MIGRATE);
    }

    // Rapport final
    const totalDuration = Date.now() - globalStart;
    const totalRows = allStats.reduce((sum, s) => sum + s.rowsWritten, 0);
    const nonEmptyTables = allStats.filter((s) => s.rowsRead > 0).length;

    // Fix 4 : catégorisation des tables par état
    const tablesOk = allStats.filter((s) => s.rowErrors.length === 0 && s.rowsRead > 0);
    const tablesPartial = allStats.filter(
      (s) => s.rowErrors.length > 0 && !s.rowErrors.every((e) => e.error.startsWith("[TABLE ERROR]")) && s.rowsWritten > 0
    );
    const tablesFatal = allStats.filter(
      (s) => s.rowErrors.length > 0 && (s.rowsWritten === 0 || s.rowErrors.some((e) => e.error.startsWith("[TABLE ERROR]")))
    );

    log(`\n${BOLD}=== Rapport de migration ===${RESET}`);
    log(`Durée totale    : ${formatDuration(totalDuration)}`);
    log(`Tables migrées  : ${nonEmptyTables}/${sortedTables.length}`);
    log(`Lignes écrites  : ${formatRows(totalRows)}`);

    // Tables OK
    if (tablesOk.length > 0) {
      log(`\n${GREEN}${BOLD}Tables OK (${tablesOk.length}):${RESET}`);
      for (const s of tablesOk) {
        log(`  ${GREEN}✓${RESET} ${s.table}: ${formatRows(s.rowsWritten)} ligne(s) ${DIM}(${formatDuration(s.durationMs)})${RESET}`);
      }
    }

    // Tables avec erreurs partielles
    if (tablesPartial.length > 0) {
      log(`\n${YELLOW}${BOLD}Tables partiellement migrées (${tablesPartial.length}):${RESET}`);
      for (const s of tablesPartial) {
        log(`  ${YELLOW}~${RESET} ${s.table}: ${formatRows(s.rowsWritten)}/${formatRows(s.rowsRead)} ligne(s) OK, ${s.rowErrors.length} erreur(s)`);
        for (const re of s.rowErrors) {
          const pkStr = Object.entries(re.pkValues).map(([k, v]) => `${k}=${v}`).join(", ");
          logWarn(`      PK {${pkStr}} — ${re.error}`);
        }
      }
    }

    // Tables complètement en erreur
    if (tablesFatal.length > 0) {
      log(`\n${RED}${BOLD}Tables en erreur (${tablesFatal.length}):${RESET}`);
      for (const s of tablesFatal) {
        log(`  ${RED}✗${RESET} ${s.table}: ${s.rowsWritten}/${formatRows(s.rowsRead)} ligne(s)`);
        for (const re of s.rowErrors) {
          const pkStr = Object.entries(re.pkValues).map(([k, v]) => `${k}=${v}`).join(", ");
          const pkLabel = pkStr ? `PK {${pkStr}}` : "TABLE";
          logError(`      ${pkLabel} — ${re.error}`);
        }
      }
      log("");
      process.exit(1);
    } else if (tablesPartial.length > 0) {
      log(`\n${YELLOW}${BOLD}Migration terminée avec des erreurs partielles.${RESET}`);
      log("");
      process.exit(1);
    } else {
      log(`\n${GREEN}${BOLD}Migration terminée avec succès.${RESET}`);
      if (DRY_RUN) {
        log(`${YELLOW}(Dry-run: aucune donnée n'a été écrite en cible)${RESET}`);
      }
      log("");
    }
  } finally {
    sourceClient?.release();
    targetClient?.release();
    await sourcePool.end();
    await targetPool?.end();
  }
}

// ---------------------------------------------------------------------------
// Utilitaire: masque le mot de passe dans une URL
// ---------------------------------------------------------------------------
function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = "****";
    return u.toString();
  } catch {
    return url.replace(/:([^@/]+)@/, ":****@");
  }
}

// ---------------------------------------------------------------------------
// Lancement
// ---------------------------------------------------------------------------
main().catch((err) => {
  logError(`Erreur fatale: ${err instanceof Error ? err.message : String(err)}`);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});
