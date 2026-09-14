import { ApiService } from './api';
import { MockService } from './mock';
import type { WaitlistService } from './types';

export * from './types';
export { ApiService } from './api';
export { MockService } from './mock';

let singleton: WaitlistService | null = null;

export function shouldUseMockBackend(): boolean {
  const flag = (import.meta.env.VITE_USE_MOCK as string | undefined)?.toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'no') return false;
  return true;
}

export function getService(): WaitlistService {
  if (singleton) return singleton;
  singleton = shouldUseMockBackend() ? new MockService() : new ApiService();
  return singleton;
}

export const service: WaitlistService = new Proxy({} as WaitlistService, {
  get(_target, prop) {
    const svc = getService();
    const value = (svc as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(svc) : value;
  },
});

export function __resetServiceForTests(mock?: WaitlistService): void {
  singleton = mock ?? null;
}
