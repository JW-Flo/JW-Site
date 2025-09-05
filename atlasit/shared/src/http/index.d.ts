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
export declare class HttpClient {
    private readonly baseURL?;
    private readonly defaultHeaders;
    private readonly logger;
    constructor(baseURL?: string, defaultHeaders?: Record<string, string>);
    private generateRequestId;
    private delay;
    private makeRequest;
    get<T = any>(url: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>>;
    post<T = any>(url: string, body?: any, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>>;
    put<T = any>(url: string, body?: any, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>>;
    delete<T = any>(url: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>>;
    patch<T = any>(url: string, body?: any, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>>;
}
export declare const httpClient: HttpClient;
export declare const get: <T = any>(url: string, options?: Omit<HttpRequestOptions, "method" | "body">) => Promise<HttpResponse<T>>;
export declare const post: <T = any>(url: string, body?: any, options?: Omit<HttpRequestOptions, "method" | "body">) => Promise<HttpResponse<T>>;
export declare const put: <T = any>(url: string, body?: any, options?: Omit<HttpRequestOptions, "method" | "body">) => Promise<HttpResponse<T>>;
export declare const del: <T = any>(url: string, options?: Omit<HttpRequestOptions, "method" | "body">) => Promise<HttpResponse<T>>;
export declare const patch: <T = any>(url: string, body?: any, options?: Omit<HttpRequestOptions, "method" | "body">) => Promise<HttpResponse<T>>;
//# sourceMappingURL=index.d.ts.map