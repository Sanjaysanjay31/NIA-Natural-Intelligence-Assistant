/**
 * Typed environment configuration for NIA Frontend
 */
export interface AppConfig {
  apiUrl: string;
  aiRuntime: 'phone_local' | 'cloud_fallback';
  enableSimulationAdapters: boolean;
  appName: string;
  appVersion: string;
}

export const config: AppConfig = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  aiRuntime: (process.env.EXPO_PUBLIC_AI_RUNTIME as 'phone_local' | 'cloud_fallback') || 'phone_local',
  enableSimulationAdapters: process.env.EXPO_PUBLIC_ENABLE_SIMULATION_ADAPTERS !== 'false',
  appName: 'NIA (Natural Intelligence Assistant)',
  appVersion: '0.1.0',
};
