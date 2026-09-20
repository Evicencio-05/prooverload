/// <reference types="node" />
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'
import { init, id } from '@instantdb/admin'
import schema from '../instant.schema'

export type AuthAction = 'signup' | 'login'

export type AuthEnv = {
  appId?: string
  adminToken?: string
}

export type AuthResult = {
  status: number
  body: { token: string } | { error: string }
}

type ParsedCredentials = { email: string; password: string }

export function authEnvFromProcess(
  env: NodeJS.ProcessEnv = process.env,
): AuthEnv {
  return {
    appId: env.VITE_INSTANT_APP_ID || env.INSTANT_APP_ID,
    adminToken: env.INSTANT_ADMIN_TOKEN,
  }
}

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

function isAuthResult(value: ParsedCredentials | AuthResult): value is AuthResult {
  return 'status' in value
}

function credentialsFromBody(body: unknown): ParsedCredentials | AuthResult {
  let parsed: { email?: string; password?: string } = {}
  if (typeof body === 'string') {
    try {
      parsed = JSON.parse(body || '{}') as { email?: string; password?: string }
    } catch {
      return { status: 400, body: { error: 'Invalid JSON' } }
    }
  } else if (body && typeof body === 'object') {
    parsed = body as { email?: string; password?: string }
  }
  const email = parsed.email?.trim().toLowerCase()
  const password = parsed.password ?? ''
  if (!email || password.length < 6) {
    return {
      status: 400,
      body: { error: 'Email and a 6+ character password are required.' },
    }
  }
  return { email, password }
}

export async function handlePasswordAuth(
  action: AuthAction,
  body: unknown,
  env: AuthEnv,
): Promise<AuthResult> {
  if (!env.appId || !env.adminToken) {
    return { status: 500, body: { error: 'Instant admin is not configured on the server.' } }
  }

  const creds = credentialsFromBody(body)
  if (isAuthResult(creds)) return creds

  const db = init({ appId: env.appId, adminToken: env.adminToken, schema })
  const { accounts } = await db.query({ accounts: { $: { where: { email: creds.email } } } })
  const existing = accounts?.[0] as { id: string; email: string; passwordHash: string } | undefined

  if (action === 'signup') {
    if (existing) {
      return { status: 409, body: { error: 'That email already has an account. Sign in instead.' } }
    }
    await db.transact(
      db.tx.accounts[id()].update({ email: creds.email, passwordHash: hashPassword(creds.password) }),
    )
    const token = await db.auth.createToken(creds.email)
    return { status: 200, body: { token } }
  }

  if (!existing || !verifyPassword(creds.password, existing.passwordHash)) {
    return { status: 401, body: { error: 'Email or password is wrong.' } }
  }
  const token = await db.auth.createToken(creds.email)
  return { status: 200, body: { token } }
}

export function handleSignup(body: unknown, env: AuthEnv): Promise<AuthResult> {
  return handlePasswordAuth('signup', body, env)
}

export function handleLogin(body: unknown, env: AuthEnv): Promise<AuthResult> {
  return handlePasswordAuth('login', body, env)
}
