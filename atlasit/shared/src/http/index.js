import { logger } from '../logger';
export class HttpClient {
    baseURL;
    defaultHeaders;
    logger = logger.withContext({ component: 'http-client' });
    constructor(baseURL, defaultHeaders = {}) {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'User-Agent': 'AtlasIT/1.0',
            ...defaultHeaders,
        };
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async makeRequest(url, options, requestId, attempt = 1) {
        const startTime = Date.now();
        try {
            const fullURL = this.baseURL ? `${this.baseURL}${url}` : url;
            const requestOptions = {
                method: options.method || 'GET',
                headers: { ...this.defaultHeaders, ...options.headers },
                signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined,
            };
            if (options.body && typeof options.body === 'object') {
                requestOptions.body = JSON.stringify(options.body);
            }
            else if (options.body) {
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
            const headers = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                data = await response.json();
            }
            else {
                data = (await response.text());
            }
            const httpResponse = {
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
        }
        catch (error) {
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
    async get(url, options = {}) {
        const requestId = this.generateRequestId();
        return this.makeRequest(url, { ...options, method: 'GET' }, requestId);
    }
    async post(url, body, options = {}) {
        const requestId = this.generateRequestId();
        return this.makeRequest(url, { ...options, method: 'POST', body }, requestId);
    }
    async put(url, body, options = {}) {
        const requestId = this.generateRequestId();
        return this.makeRequest(url, { ...options, method: 'PUT', body }, requestId);
    }
    async delete(url, options = {}) {
        const requestId = this.generateRequestId();
        return this.makeRequest(url, { ...options, method: 'DELETE' }, requestId);
    }
    async patch(url, body, options = {}) {
        const requestId = this.generateRequestId();
        return this.makeRequest(url, { ...options, method: 'PATCH', body }, requestId);
    }
}
// Export singleton instance
export const httpClient = new HttpClient();
// Helper functions for common HTTP operations
export const get = (url, options) => httpClient.get(url, options);
export const post = (url, body, options) => httpClient.post(url, body, options);
export const put = (url, body, options) => httpClient.put(url, body, options);
export const del = (url, options) => httpClient.delete(url, options);
export const patch = (url, body, options) => httpClient.patch(url, body, options);
//# sourceMappingURL=index.js.map