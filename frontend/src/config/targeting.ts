/**
 * NIA Backend Target Configuration & Resolver
 * Handles environment-driven switching between Render Cloud, Laptop LAN, and Custom URLs.
 */

export type BackendTarget = 'render' | 'lan' | 'custom';

export interface TargetingConfig {
  activeTarget: BackendTarget;
  laptopWifiIp: string;
  apiPort: number;
  renderApiUrl: string;
  customUrl: string | null;
}

// In-memory runtime state for development switching
let currentTarget: BackendTarget =
  (process.env.EXPO_PUBLIC_BACKEND_TARGET as BackendTarget) || 'render';

let currentLaptopIp: string =
  process.env.EXPO_PUBLIC_LAPTOP_WIFI_IP || '192.168.1.100';

const DEFAULT_API_PORT = 8000;

let currentRenderUrl: string =
  process.env.EXPO_PUBLIC_RENDER_API_URL || 'https://nia-backend.onrender.com';

let customRuntimeUrl: string | null = null;

/**
 * Validates and normalizes backend URLs.
 * - Enforces http:// or https:// protocol
 * - Removes trailing slashes
 * - Rejects malformed hostnames/URLs
 * - Prevents silent downgrading of https to http
 */
export function normalizeBackendUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Backend URL cannot be empty.');
  }

  const trimmed = rawUrl.trim();

  // Basic regex protocol check
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(`Malformed URL "${trimmed}": Protocol must be http:// or https://`);
  }

  try {
    // URL parsing validation
    const parsed = new URL(trimmed);
    if (!parsed.hostname || parsed.hostname.length === 0) {
      throw new Error(`Malformed URL "${trimmed}": Missing valid hostname.`);
    }

    // Strip trailing slash
    return trimmed.replace(/\/+$/, '');
  } catch (err: any) {
    throw new Error(`Malformed URL "${trimmed}": ${err.message || 'Invalid URI format'}`);
  }
}

/**
 * Resolves the active base API URL using strict 4-tier precedence:
 * 1. Explicit runtime / custom URL
 * 2. EXPO_PUBLIC_API_BASE_URL environment override
 * 3. Selected backend target (render | lan)
 * 4. Safe development default (http://localhost:8000)
 */
export function resolveApiBaseUrl(): string {
  // 1. Explicit runtime/custom URL
  if (customRuntimeUrl && customRuntimeUrl.trim().length > 0) {
    return normalizeBackendUrl(customRuntimeUrl);
  }

  // 2. EXPO_PUBLIC_API_BASE_URL environment variable
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envBaseUrl && envBaseUrl.trim().length > 0) {
    return normalizeBackendUrl(envBaseUrl);
  }

  // 3. Selected backend target
  if (currentTarget === 'render') {
    return normalizeBackendUrl(currentRenderUrl);
  } else if (currentTarget === 'lan') {
    const lanUrl = `http://${currentLaptopIp}:${DEFAULT_API_PORT}`;
    return normalizeBackendUrl(lanUrl);
  }

  // 4. Safe development default
  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveApiBaseUrl();

export function getBackendTarget(): BackendTarget {
  return currentTarget;
}

export function setBackendTarget(target: BackendTarget): void {
  currentTarget = target;
}

export function setCustomBackendUrl(url: string): void {
  const normalized = normalizeBackendUrl(url);
  customRuntimeUrl = normalized;
  currentTarget = 'custom';
}

export function clearCustomBackendUrl(): void {
  customRuntimeUrl = null;
  currentTarget = 'render';
}

export function setLaptopWifiIp(ip: string): void {
  const cleanIp = ip.trim();
  if (!cleanIp) {
    throw new Error('Laptop IP cannot be empty.');
  }
  currentLaptopIp = cleanIp;
}

export function getLaptopWifiIp(): string {
  return currentLaptopIp;
}

export function getTargetingConfig(): TargetingConfig {
  return {
    activeTarget: currentTarget,
    laptopWifiIp: currentLaptopIp,
    apiPort: DEFAULT_API_PORT,
    renderApiUrl: currentRenderUrl,
    customUrl: customRuntimeUrl,
  };
}
