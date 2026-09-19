#!/usr/bin/env node
/** Auth handler checks that do not call Instant. */
import { handleLogin, handleSignup } from '../server/auth-core.ts'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const missingEnv = await handleSignup({ email: 'a@b.com', password: 'secret1' }, {})
assert(missingEnv.status === 500, 'missing Instant admin env should 500')
assert('error' in missingEnv.body, 'missing env returns error json')

const shortPassword = await handleSignup(
  { email: 'a@b.com', password: '123' },
  { appId: 'x', adminToken: 'y' },
)
assert(shortPassword.status === 400, 'short password should 400')

const badJson = await handleLogin('not-json', { appId: 'x', adminToken: 'y' })
assert(badJson.status === 400, 'invalid JSON string body should 400')

console.log('auth-smoke ok')
