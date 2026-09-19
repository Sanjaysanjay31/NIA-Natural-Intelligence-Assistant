/**
 * Shared NIA Domain Contracts
 * Note: Comprehensive domain types will be fully expanded in Prompt 2.
 */

export interface SystemHealth {
  status: string;
  appName: string;
  version: string;
  environment: string;
  timestamp: string;
}
