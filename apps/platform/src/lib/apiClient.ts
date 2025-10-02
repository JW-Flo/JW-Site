// Lightweight API client for compliance worker endpoints
// Centralizes base URL resolution, error handling, and JSON parsing.
// Future enhancements: auth token injection, retry with backoff, circuit breaker.

export interface ApiClientOptions {
  baseUrl?: string;
  defaultTenant?: string;
  fetchImpl?: typeof fetch;
}

export class ApiError extends Error {
  constructor(public status: number, public requestId: string | undefined, message: string) {
    super(message);
  }
}

export class ApiClient {
  private baseUrl: string;
  private defaultTenant: string;
  private fetchImpl: typeof fetch;

  constructor(opts: ApiClientOptions = {}) {
    this.baseUrl = (opts.baseUrl || import.meta.env.PUBLIC_COMPLIANCE_API_BASE || '').replace(/\/$/, '');
    if (!this.baseUrl) {
      console.warn('[ApiClient] No base URL configured; relative requests will be used.');
    }
    this.defaultTenant = opts.defaultTenant || 'demo';
    this.fetchImpl = opts.fetchImpl || fetch;
  }

  private buildUrl(path: string, params?: Record<string, string | number | undefined | null>) {
    const url = new URL((this.baseUrl || '') + path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
      });
    }
    return url.toString();
  }

  private async request<T>(method: string, path: string, opts: { params?: Record<string, any>; body?: any; headers?: Record<string,string> } = {}): Promise<T> {
    const url = this.buildUrl(path, opts.params);
    const headers: Record<string,string> = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    let resp: Response;
    try {
      resp = await this.fetchImpl(url, {
        method,
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });
    } catch (e: any) {
      throw new ApiError(0, undefined, `Network error: ${e?.message || e}`);
    }
    const requestId = resp.headers.get('X-Request-ID') || undefined;
    let data: any = null;
    const text = await resp.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    if (!resp.ok) {
      const msg = (data && (data.error || data.message)) || `HTTP ${resp.status}`;
      throw new ApiError(resp.status, requestId, msg);
    }
    return data as T;
  }

  // --- Security Incidents ---
  listIncidents(params: { tenantId?: string; status?: string; severity?: string; limit?: number; cursor?: number } = {}) {
    return this.request<{ items: any[]; nextCursor?: string }>('GET', '/api/v1/security/incidents', { params: { tenantId: params.tenantId || this.defaultTenant, ...params } });
  }
  createIncident(body: { tenantId?: string; title: string; severity?: string; source?: string | null }) {
    return this.request<any>('POST', '/api/v1/security/incidents', { body: { tenantId: body.tenantId || this.defaultTenant, ...body } });
  }
  resolveIncident(id: number, params: { tenantId?: string } = {}) {
    return this.request<any>('POST', `/api/v1/security/incidents/${id}/resolve`, { params: { tenantId: params.tenantId || this.defaultTenant } });
  }
  securityStatus(params: { tenantId?: string } = {}) {
    return this.request<any>('GET', '/api/v1/security/status', { params: { tenantId: params.tenantId || this.defaultTenant } });
  }

  // --- Activity ---
  listActivity(params: { tenantId?: string; type?: string; limit?: number; cursor?: number } = {}) {
    return this.request<{ items: any[]; nextCursor?: string }>('GET', '/api/v1/activity', { params: { tenantId: params.tenantId || this.defaultTenant, ...params } });
  }

  // --- Notifications ---
  listNotifications(params: { tenantId?: string } = {}) {
    return this.request<{ items: any[] }>('GET', '/api/v1/notifications', { params: { tenantId: params.tenantId || this.defaultTenant } });
  }

  // --- Policies ---
  listPolicyTemplates() {
    return this.request<{ templates: Array<{ key: string; name: string; format: string }> }>('GET', '/api/v1/policies/templates');
  }
  generatePolicy(body: { templateKey: string; input?: Record<string, unknown> }) {
    return this.request<any>('POST', '/api/v1/policies/generate', { body });
  }
  evaluatePolicy(body: { policyKey: string; input?: Record<string, unknown> }) {
    return this.request<any>('POST', '/api/v1/policy/evaluate', { body });
  }
  coverage(framework?: string) {
    const params = framework ? { framework } : undefined;
    return this.request<any>('GET', '/api/v1/policies/coverage', { params });
  }

  // --- Evidence ---
  ingestEvidence(body: { tenantId?: string; pack?: string; subject?: string; payload: Record<string, unknown> }) {
    return this.request<any>('POST', '/api/evidence/ingest', { body: { tenantId: body.tenantId || this.defaultTenant, ...body } });
  }
  searchEvidence(params: { tenantId?: string; pack?: string; subject?: string; limit?: number; cursor?: number } = {}) {
    return this.request<any>('GET', '/api/evidence/search', { params });
  }
  getEvidence(hash: string, verify = false) {
    return this.request<any>('GET', `/api/evidence/${hash}${verify ? '?verify=1' : ''}`);
  }
  verifyEvidence(hash: string) {
    return this.getEvidence(hash, true);
  }

  // --- Health ---
  health() {
    return this.request<any>('GET', '/health');
  }
}

export const apiClient = new ApiClient();
