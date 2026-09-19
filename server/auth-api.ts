import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { init, id } from '@instantdb/admin'
import schema from '../instant.schema.ts'

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const test = pbkdf2Sync(password, salt, 120000, 32, 'sha256')
  const a = Buffer.from(hash, 'hex')
  if (a.length !== test.length) return false
  return timingSafeEqual(a, test)
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c as Buffer))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export async function handleAuthApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url ?? ''
  if (!url.startsWith('/api/auth')) return false
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return true
  }

  const appId = process.env.VITE_INSTANT_APP_ID || process.env.INSTANT_APP_ID
  const adminToken = process.env.INSTANT_ADMIN_TOKEN
  if (!appId || !adminToken) {
    send(res, 500, { error: 'Instant admin is not configured on the server.' })
    return true
  }

  const db = init({ appId, adminToken, schema })
  const raw = await readBody(req)
  let parsed: { email?: string; password?: string } = {}
  try {
    parsed = JSON.parse(raw || '{}')
  } catch {
    send(res, 400, { error: 'Invalid JSON' })
    return true
  }
  const email = parsed.email?.trim().toLowerCase()
  const password = parsed.password ?? ''
  if (!email || password.length < 6) {
    send(res, 400, { error: 'Email and a 6+ character password are required.' })
    return true
  }

  const isSignup = url.startsWith('/api/auth/signup')
  const isLogin = url.startsWith('/api/auth/login')
  if (!isSignup && !isLogin) {
    send(res, 404, { error: 'Not found' })
    return true
  }

  const { accounts } = await db.query({ accounts: { $: { where: { email } } } })
  const existing = accounts?.[0] as { id: string; email: string; passwordHash: string } | undefined

  if (isSignup) {
    if (existing) {
      send(res, 409, { error: 'That email already has an account. Sign in instead.' })
      return true
    }
    await db.transact(
      db.tx.accounts[id()].update({ email, passwordHash: hashPassword(password) }),
    )
    const token = await db.auth.createToken(email)
    send(res, 200, { token })
    return true
  }

  if (!existing || !verifyPassword(password, existing.passwordHash)) {
    send(res, 401, { error: 'Email or password is wrong.' })
    return true
  }
  const token = await db.auth.createToken(email)
  send(res, 200, { token })
  return true
}
