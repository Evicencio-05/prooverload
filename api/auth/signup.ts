import { dispatchAuthRequest } from './_shared'

export const config = { runtime: 'nodejs' }

export default {
  fetch(request: Request) {
    return dispatchAuthRequest('signup', request)
  },
}
