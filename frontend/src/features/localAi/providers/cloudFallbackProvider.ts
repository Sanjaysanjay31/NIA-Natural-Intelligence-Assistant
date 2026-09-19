import { CloudFallbackProvider } from '../types';

/**
 * CloudFallbackProvider Interface Implementation.
 * Invariant: Interface only. Enforces the Render memory-safety constraint:
 * Cloud server must NOT load heavy multi-GB models. Cloud fallback is strictly restricted
 * to lightweight JSON verification or disabled by default.
 */
export class RestrainedCloudFallbackProvider implements CloudFallbackProvider {
  private allowCloudFallback: boolean = false;

  constructor(allowFallback: boolean = false) {
    this.allowCloudFallback = allowFallback;
  }

  setCloudFallbackAllowed(allowed: boolean) {
    this.allowCloudFallback = allowed;
  }

  isCloudFallbackAllowed(): boolean {
    return this.allowCloudFallback;
  }

  async requestFallbackInference(task: string, payload: any): Promise<any> {
    if (!this.allowCloudFallback) {
      throw new Error(
        'CLOUD_FALLBACK_DISABLED: Local AI runtime is phone-first. Heavy models are not loaded on Render cloud.'
      );
    }
    return { fallbackUsed: true, task, status: 'RESTRICTED_CLOUD_CALL' };
  }
}
