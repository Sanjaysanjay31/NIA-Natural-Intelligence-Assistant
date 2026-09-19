import { config } from '../config/env';
import { HealthResponse } from '../contracts';

/**
 * Base HTTP API Client for NIA Backend Communication
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = config.apiUrl) {
    this.baseUrl = baseUrl;
  }

  async getHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/health`);
    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }
    return response.json();
  }
}

export const apiClient = new ApiClient();
