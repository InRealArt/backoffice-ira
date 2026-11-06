import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const SCRIPT = path.resolve(__dirname, '../scripts/check-action-guards.mjs')

let root: string

function write(rel: string, content: string) {
    const full = path.join(root, rel)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content)
}

function run(...args: string[]) {
    const r = spawnSync('node', [SCRIPT, ...args], { env: { ...process.env, GUARDS_ROOT: root }, encoding: 'utf8' })
    return { code: r.status, out: r.stdout + r.stderr }
}

beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'guards-'))
    fs.mkdirSync(path.join(root, 'lib/actions'), { recursive: true })
    fs.mkdirSync(path.join(root, 'app/api'), { recursive: true })
    fs.mkdirSync(path.join(root, 'scripts'), { recursive: true })
})
afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

const baseline = (...ids: string[]) => write('scripts/action-guards-baseline.json', JSON.stringify({ unguarded: ids }))

describe('check-action-guards', () => {
    it('passe quand toutes les actions sont gardées', () => {
        write('lib/actions/a.ts', `export async function del() {\n  await requireAdmin()\n  return 1\n}\n`)
        expect(run().code).toBe(0)
    })

    it('accepte const x = await requireRole(...) et les arrow functions exportées', () => {
        write('lib/actions/a.ts', `export const f = async () => {\n  const s = await requireRole('admin')\n  return s\n}\n`)
        expect(run().code).toBe(0)
    })

    it('échoue sur une action sans garde et la nomme', () => {
        write('lib/actions/a.ts', `export async function del() {\n  return 1\n}\n`)
        const r = run()
        expect(r.code).toBe(1)
        expect(r.out).toContain('lib/actions/a.ts#del')
    })

    it('refuse une garde qui n\'est pas la première instruction', () => {
        write('lib/actions/a.ts', `export async function del() {\n  const x = 1\n  await requireAdmin()\n}\n`)
        expect(run().code).toBe(1)
    })

    it('refuse un simple appel non attendu (sans await)', () => {
        write('lib/actions/a.ts', `export async function del() {\n  requireAdmin()\n}\n`)
        expect(run().code).toBe(1)
    })

    it('accepte la garde en tête d\'un try dans une route API', () => {
        write('app/api/x/route.ts', `export async function POST() {\n  try {\n    await requireAdmin()\n  } catch (e) {}\n}\n`)
        expect(run().code).toBe(0)
    })

    it('ignore les exports de route qui ne sont pas des verbes HTTP', () => {
        write('app/api/x/route.ts', `export async function helper() {}\nexport const runtime = 'nodejs'\n`)
        expect(run().code).toBe(0)
    })

    it('tolère une fonction non gardée présente dans la baseline', () => {
        write('lib/actions/a.ts', `export async function pub() {}\n`)
        baseline('lib/actions/a.ts#pub')
        expect(run().code).toBe(0)
    })

    it('échoue si la baseline contient une entrée désormais gardée (baseline périmée)', () => {
        write('lib/actions/a.ts', `export async function pub() {\n  await requireAdmin()\n}\n`)
        baseline('lib/actions/a.ts#pub')
        const r = run()
        expect(r.code).toBe(1)
        expect(r.out).toContain('Baseline périmée')
    })

    it('échoue si la baseline contient une fonction supprimée', () => {
        baseline('lib/actions/gone.ts#old')
        const r = run()
        expect(r.code).toBe(1)
        expect(r.out).toContain('fonction supprimée')
    })

    it('--update-baseline écrit la dette actuelle puis le check passe', () => {
        write('lib/actions/a.ts', `export async function pub() {}\n`)
        expect(run('--update-baseline').code).toBe(0)
        expect(JSON.parse(fs.readFileSync(path.join(root, 'scripts/action-guards-baseline.json'), 'utf8')).unguarded).toEqual([
            'lib/actions/a.ts#pub',
        ])
        expect(run().code).toBe(0)
    })
})
