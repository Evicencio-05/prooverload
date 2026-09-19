import { dispatchAuthRequest } from './_shared.ts'

export const config = { runtime: 'nodejs' }

export default {
  fetch(request: Request) {
    return dispatchAuthRequest('login', request)
  },
}
