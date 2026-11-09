#!/usr/bin/env node
/**
 * Vérifie que chaque Server Action (lib/actions/*.ts) et chaque route handler
 * (app/api/**\/route.ts) commence par une garde d'autorisation.
 *
 * Pourquoi : une Server Action est un endpoint HTTP appelable directement, et le proxy
 * ignore les POST et les routes /api. Protéger le menu ou la page ne suffit pas.
 *
 * Règle : la PREMIÈRE instruction du corps (ou du `try` de tête, pour les route handlers)
 * doit être `await requireXxx(...)` (ou `const x = await requireXxx(...)`), avec Xxx parmi GUARD_NAMES.
 *
 * Baseline : les fonctions volontairement non gardées (publiques, ou pas encore migrées)
 * sont listées dans scripts/action-guards-baseline.json. Le script échoue si :
 *   - une fonction non gardée n'est PAS dans la baseline (nouvel oubli) ;
 *   - une entrée de la baseline est devenue gardée ou n'existe plus (baseline périmée,
 *     à nettoyer pour que la dette ne fasse que diminuer).
 *
 * Usage :
 *   node scripts/check-action-guards.mjs                     # vérification (CI)
 *   node scripts/check-action-guards.mjs --list              # liste tout ce qui n'est pas gardé
 *   node scripts/check-action-guards.mjs --update-baseline   # réécrit la baseline (à relire !)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// GUARDS_ROOT permet de pointer le script vers un dossier de fixtures (utilisé par les tests).
const ROOT = process.env.GUARDS_ROOT
    ? path.resolve(process.env.GUARDS_ROOT)
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASELINE_PATH = path.join(ROOT, 'scripts/action-guards-baseline.json')

const GUARD_NAMES = new Set([
    'requireAdmin',
    'requireRole',
    'requireSession',
    'requireBackofficeUser',
    'requireArtistAccess',
    'requireAuthUserAccess',
    'requirePresaleArtworkAccess',
    'requireItemAccess',
    'requirePhysicalItemAccess',
    'requirePhysicalCollectionAccess',
    'requireArtistAddressAccess',
])
const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])

const args = new Set(process.argv.slice(2))

function walk(dir, predicate, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
            walk(full, predicate, out)
        } else if (predicate(full)) {
            out.push(full)
        }
    }
    return out
}

/** Le premier statement est-il un appel `await guard(...)` ? */
function startsWithGuard(body) {
    if (!body || !ts.isBlock(body) || body.statements.length === 0) return false
    let first = body.statements[0]

    // Route handlers : `try { await requireAdmin() ... } catch` — la garde peut ouvrir un try de tête.
    if (ts.isTryStatement(first) && first.tryBlock.statements.length > 0) {
        first = first.tryBlock.statements[0]
    }

    let expr
    if (ts.isExpressionStatement(first)) expr = first.expression
    else if (ts.isVariableStatement(first) && first.declarationList.declarations.length === 1) {
        expr = first.declarationList.declarations[0].initializer
    }
    if (!expr || !ts.isAwaitExpression(expr)) return false

    const call = expr.expression
    return ts.isCallExpression(call) && ts.isIdentifier(call.expression) && GUARD_NAMES.has(call.expression.text)
}

/** Fonctions exportées d'un fichier : [{ name, body }] */
function exportedFunctions(sf, { routeHandlers }) {
    const result = []
    const isExported = (node) => node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)

    for (const stmt of sf.statements) {
        if (ts.isFunctionDeclaration(stmt) && isExported(stmt) && stmt.name) {
            result.push({ name: stmt.name.text, body: stmt.body })
        } else if (ts.isVariableStatement(stmt) && isExported(stmt)) {
            for (const decl of stmt.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name) || !decl.initializer) continue
                const init = decl.initializer
                if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
                    result.push({ name: decl.name.text, body: init.body })
                }
            }
        }
    }
    return routeHandlers ? result.filter((f) => HTTP_METHODS.has(f.name)) : result
}

function collect() {
    const actionFiles = new Set(walk(path.join(ROOT, 'lib/actions'), (f) => /\.tsx?$/.test(f)))

    // Toute Server Action est un endpoint public, où qu'elle soit : on ajoute aussi tous les
    // fichiers marqués 'use server' hors lib/actions (app/, lib/, components/, hooks/).
    const USE_SERVER = /^(?:\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/))*\s*['"]use server['"]/
    for (const dir of ['app', 'lib', 'components', 'hooks']) {
        const root = path.join(ROOT, dir)
        if (!fs.existsSync(root)) continue
        for (const f of walk(root, (file) => /\.tsx?$/.test(file) && !/\/route\.tsx?$/.test(file))) {
            if (USE_SERVER.test(fs.readFileSync(f, 'utf8'))) actionFiles.add(f)
        }
    }

    const targets = [
        ...[...actionFiles].map((f) => ({ file: f, routeHandlers: false })),
        ...walk(path.join(ROOT, 'app/api'), (f) => /\/route\.tsx?$/.test(f)).map((f) => ({ file: f, routeHandlers: true })),
    ]

    const all = []
    for (const { file, routeHandlers } of targets) {
        const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
        const rel = path.relative(ROOT, file)
        for (const fn of exportedFunctions(sf, { routeHandlers })) {
            all.push({ id: `${rel}#${fn.name}`, guarded: startsWithGuard(fn.body) })
        }
    }
    return all.sort((a, b) => a.id.localeCompare(b.id))
}

const all = collect()
const unguarded = all.filter((f) => !f.guarded).map((f) => f.id)

if (args.has('--list')) {
    const byFile = new Map()
    for (const id of unguarded) {
        const [file, fn] = id.split('#')
        byFile.set(file, [...(byFile.get(file) ?? []), fn])
    }
    for (const [file, fns] of byFile) console.log(`${file} (${fns.length})\n  ${fns.join(', ')}`)
    console.log(`\n${unguarded.length} non gardée(s) sur ${all.length} fonction(s) exportée(s).`)
    process.exit(0)
}

if (args.has('--update-baseline')) {
    fs.writeFileSync(BASELINE_PATH, JSON.stringify({ unguarded }, null, 2) + '\n')
    console.log(`Baseline écrite : ${unguarded.length} entrée(s) dans ${path.relative(ROOT, BASELINE_PATH)}`)
    process.exit(0)
}

const baseline = fs.existsSync(BASELINE_PATH)
    ? new Set(JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')).unguarded)
    : new Set()

const existing = new Set(all.map((f) => f.id))
const newlyUnguarded = unguarded.filter((id) => !baseline.has(id))
const stale = [...baseline].filter((id) => !unguarded.includes(id))

let failed = false

if (newlyUnguarded.length > 0) {
    failed = true
    console.error('\n✗ Fonctions exportées sans garde d\'autorisation (hors baseline) :')
    for (const id of newlyUnguarded) console.error(`  - ${id}`)
    console.error(
        '\n  Ajoutez `await requireAdmin()` (ou requireRole / requireSession)\n' +
            '  en PREMIÈRE instruction, avant tout try/catch.\n' +
            '  Si la fonction est volontairement publique, ajoutez-la à la baseline après revue :\n' +
            '  node scripts/check-action-guards.mjs --update-baseline',
    )
}

if (stale.length > 0) {
    failed = true
    console.error('\n✗ Baseline périmée (désormais gardées ou supprimées) — à retirer :')
    for (const id of stale) console.error(`  - ${id}${existing.has(id) ? '' : '  (fonction supprimée)'}`)
    console.error('\n  Relancez : node scripts/check-action-guards.mjs --update-baseline')
}

if (failed) process.exit(1)

console.log(
    `✓ Gardes OK : ${all.length - unguarded.length} gardée(s), ${unguarded.length} en baseline (dette connue) sur ${all.length}.`,
)
