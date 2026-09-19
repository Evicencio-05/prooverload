import { init } from '@instantdb/core';
import schema from '../../instant.schema';

const appId = import.meta.env.VITE_INSTANT_APP_ID;

export const db = appId ? init({ appId, schema }) : null;

export function instantConfigError(): string | null {
  if (!appId) {
    return 'Instant is not configured. Set VITE_INSTANT_APP_ID so ProOverload can store accounts in the cloud.';
  }
  return null;
}
