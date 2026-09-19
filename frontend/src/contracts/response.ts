export interface NIAResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  appName: string;
  version: string;
  environment: string;
  timestamp: string;
}
