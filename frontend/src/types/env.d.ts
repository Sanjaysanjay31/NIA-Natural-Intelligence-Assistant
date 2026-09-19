declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_AI_RUNTIME?: string;
    EXPO_PUBLIC_ENABLE_SIMULATION_ADAPTERS?: string;
    [key: string]: string | undefined;
  }
}
