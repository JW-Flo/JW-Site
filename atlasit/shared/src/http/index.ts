import { logger } from '../logger';

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  requestId: string;
}

export class HttpClient {
  private readonly baseURL?: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly logger = logger.withContext({ component: 'http-client' });

  constructor(baseURL?: string, defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'AtlasIT/1.0',
      ...defaultHeaders,
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(
    url: string,
    options: HttpRequestOptions,
    requestId: string,
    attempt: number = 1
  ): Promise<HttpResponse<T>> {
    const startTime = Date.now();

    try {
      const fullURL = this.baseURL ? `${this.baseURL}${url}` : url;

      const requestOptions: RequestInit = {
        method: options.method || 'GET',
        headers: { ...this.defaultHeaders, ...options.headers },
        signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined,
      };

      if (options.body && typeof options.body === 'object') {
        requestOptions.body = JSON.stringify(options.body);
      } else if (options.body) {
        requestOptions.body = options.body;
      }

      this.logger.info('Making HTTP request', {
        requestId,
        method: requestOptions.method,
        url: fullURL,
        attempt,
      });

      const response = await fetch(fullURL, requestOptions);
      const responseTime = Date.now() - startTime;

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json() as T;
      } else {
        data = (await response.text()) as T;
      }

      const httpResponse: HttpResponse<T> = {
        status: response.status,
        statusText: response.statusText,
        headers,
        data,
        requestId,
      };

      if (!response.ok) {
        this.logger.warn('HTTP request failed', {
          requestId,
          status: response.status,
          statusText: response.statusText,
          responseTime,
          attempt,
        });

        // Retry logic for certain status codes
        const shouldRetry = options.retries && options.retries > 0 &&
          attempt < (options.retries + 1) &&
          [408, 429, 500, 502, 503, 504].includes(response.status);

        if (shouldRetry) {
          const delay = options.retryDelay || Math.pow(2, attempt) * 1000; // Exponential backoff
          this.logger.info('Retrying HTTP request', { requestId, attempt: attempt + 1, delay });
          await this.delay(delay);
          return this.makeRequest(url, options, requestId, attempt + 1);
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.info('HTTP request successful', {
        requestId,
        status: response.status,
        responseTime,
        attempt,
      });

      return httpResponse;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.logger.error('HTTP request error', error, {
        requestId,
        url: this.baseURL ? `${this.baseURL}${url}` : url,
        responseTime,
        attempt,
      });

      throw error;
    }
  }

  async get<T = any>(url: string, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    const requestId = this.generateRequestId();
    return this.makeRequest<T>(url, { ...options, method: 'GET' }, requestId);
  }

  async post<T = any>(url: string, body?: any, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    const requestId = this.generateRequestId();
    return this.makeRequest<T>(url, { ...options, method: 'POST', body }, requestId);
  }

  async put<T = any>(url: string, body?: any, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    const requestId = this.generateRequestId();
    return this.makeRequest<T>(url, { ...options, method: 'PUT', body }, requestId);
  }

  async delete<T = any>(url: string, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    const requestId = this.generateRequestId();
    return this.makeRequest<T>(url, { ...options, method: 'DELETE' }, requestId);
  }

  async patch<T = any>(url: string, body?: any, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    const requestId = this.generateRequestId();
    return this.makeRequest<T>(url, { ...options, method: 'PATCH', body }, requestId);
  }
}

// Export singleton instance
export const httpClient = new HttpClient();

// Helper functions for common HTTP operations
export const get = <T = any>(url: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>) =>
  httpClient.get<T>(url, options);

export const post = <T = any>(url: string, body?: any, options?: Omit<HttpRequestOptions, 'method' | 'body'>) =>
  httpClient.post<T>(url, body, options);

export const put = <T = any>(url: string, body?: any, options?: Omit<HttpRequestOptions, 'method' | 'body'>) =>
  httpClient.put<T>(url, body, options);

export const del = <T = any>(url: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>) =>
  httpClient.delete<T>(url, options);

export const patch = <T = any>(url: string, body?: any, options?: Omit<HttpRequestOptions, 'method' | 'body'>) =>
  httpClient.patch<T>(url, body, options);
