#!/usr/bin/env node
/**
 * Typecheck /api the way Vercel Node functions do: root tsconfig compilerOptions
 * (project references ignored), .ts import suffixes allowed via rewrite, Node types on.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'prooverload-vercel-tsc-'))
const configPath = join(dir, 'tsconfig.json')

writeFileSync(
  configPath,
  JSON.stringify({
    extends: join(root, 'tsconfig.json'),
    compilerOptions: {
      noEmit: true,
      noCheck: false,
    },
    files: [join(root, 'api/auth/login.ts'), join(root, 'api/auth/signup.ts')],
    include: [],
    exclude: [],
  }),
)

const result = spawnSync(
  process.execPath,
  [join(root, 'node_modules/typescript/bin/tsc'), '--pretty', 'false', '-p', configPath],
  { cwd: root, stdio: 'inherit' },
)

rmSync(dir, { recursive: true, force: true })

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
console.log('vercel-api-typecheck ok')
