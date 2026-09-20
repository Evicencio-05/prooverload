import type { IncomingMessage, ServerResponse } from 'node:http'
import { authEnvFromProcess, handlePasswordAuth } from './auth-core.ts'

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

  const env = authEnvFromProcess()
  if (!env.appId || !env.adminToken) {
    send(res, 500, { error: 'Instant admin is not configured on the server.' })
    return true
  }

  const raw = await readBody(req)
  let parsed: unknown
  try {
    parsed = JSON.parse(raw || '{}')
  } catch {
    send(res, 400, { error: 'Invalid JSON' })
    return true
  }

  const isSignup = url.startsWith('/api/auth/signup')
  const isLogin = url.startsWith('/api/auth/login')
  if (!isSignup && !isLogin) {
    send(res, 404, { error: 'Not found' })
    return true
  }

  try {
    const result = await handlePasswordAuth(isSignup ? 'signup' : 'login', parsed, env)
    send(res, result.status, result.body)
  } catch (err) {
    console.error('[api/auth]', err)
    send(res, 500, { error: 'Auth request failed' })
  }
  return true
}
