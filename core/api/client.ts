import { Platform } from 'react-native';

/**
 * Base API configuration
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

console.log('[API] Base URL:', API_BASE_URL);

const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, config: RequestConfig): Promise<T> {
    const isFormData = config.body instanceof FormData;
    const headers: Record<string, string> = {
      ...config.headers,
    };

    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: config.method,
        headers,
        body: isFormData ? (config.body as any) : (config.body ? JSON.stringify(config.body) : undefined),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const responseText = await response.text();
        console.log(`[API ERROR] ${config.method} ${endpoint} -> ${response.status}: ${responseText}`);

        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.log(`[API TIMEOUT] ${config.method} ${endpoint} timed out after ${REQUEST_TIMEOUT_MS}ms`);
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: data, headers });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: data });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // For logout API that needs explicit token in header
  async postWithAuth<T>(endpoint: string, data: unknown, token: string): Promise<T> {
    return this.request<T>(endpoint, { 
      method: 'POST', 
      body: data,
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
