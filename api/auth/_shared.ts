import { authEnvFromProcess, handleLogin, handleSignup, type AuthAction } from '../../server/auth-core.ts'

export async function dispatchAuthRequest(action: AuthAction, request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  let body: unknown = {}
  const raw = await request.text()
  if (raw) {
    try {
      body = JSON.parse(raw)
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }
  }

  const run = action === 'signup' ? handleSignup : handleLogin
  const result = await run(body, authEnvFromProcess())
  return Response.json(result.body, { status: result.status })
}
