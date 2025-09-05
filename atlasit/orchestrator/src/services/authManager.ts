import { logger, AtlasITError } from '@atlasit/shared';

export interface AuthConfig {
  type: 'api-key' | 'oauth2' | 'basic' | 'bearer' | 'aws-sig' | 'custom';
  credentials: Record<string, any>;
  baseUrl?: string;
  timeout?: number;
  retryConfig?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export interface SystemAuth {
  [systemName: string]: AuthConfig;
}

export class AuthenticationManager {
  private readonly authConfigs: Map<string, AuthConfig> = new Map();
  private readonly tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

  constructor(private readonly tenantId: string) {}

  /**
   * Register authentication configuration for a system
   */
  registerAuth(systemName: string, config: AuthConfig): void {
    this.authConfigs.set(systemName, config);
    logger.info('Registered authentication config', {
      tenantId: this.tenantId,
      systemName,
      authType: config.type
    });
  }

  /**
   * Get authentication headers for a system
   */
  async getAuthHeaders(systemName: string): Promise<Record<string, string>> {
    const config = this.authConfigs.get(systemName);
    if (!config) {
      throw new AtlasITError(
        'AUTH-001',
        `No authentication config found for system: ${systemName}`,
        400,
        { systemName, tenantId: this.tenantId }
      );
    }

    switch (config.type) {
      case 'api-key':
        return this.getApiKeyHeaders(config);

      case 'oauth2':
        return await this.getOAuth2Headers(systemName, config);

      case 'basic':
        return this.getBasicAuthHeaders(config);

      case 'bearer':
        return this.getBearerHeaders(config);

      case 'aws-sig':
        return await this.getAwsSignatureHeaders(config);

      case 'custom':
        return this.getCustomHeaders(config);

      default:
        throw new AtlasITError(
          'AUTH-002',
          `Unsupported authentication type: ${config.type}`,
          400,
          { systemName, authType: config.type }
        );
    }
  }

  private getApiKeyHeaders(config: AuthConfig): Record<string, string> {
    const { apiKey, headerName = 'X-API-Key' } = config.credentials;

    if (!apiKey) {
      throw new AtlasITError(
        'AUTH-003',
        'API key not configured',
        500,
        { authType: 'api-key' }
      );
    }

    return {
      [headerName]: apiKey
    };
  }

  private async getOAuth2Headers(systemName: string, config: AuthConfig): Promise<Record<string, string>> {
    const cacheKey = `${this.tenantId}:${systemName}:oauth2`;
    const cached = this.tokenCache.get(cacheKey);

    // Check if we have a valid cached token
    if (cached && cached.expiresAt > Date.now()) {
      return {
        'Authorization': `Bearer ${cached.token}`
      };
    }

    // Get new token
    const token = await this.refreshOAuth2Token(config);

    // Cache the token (expires 5 minutes before actual expiry)
    const expiresAt = Date.now() + (config.credentials.expires_in - 300) * 1000;
    this.tokenCache.set(cacheKey, { token, expiresAt });

    return {
      'Authorization': `Bearer ${token}`
    };
  }

  private async refreshOAuth2Token(config: AuthConfig): Promise<string> {
    const { clientId, clientSecret, tokenUrl, scope } = config.credentials;

    const authHeader = `Basic ${btoa(clientId + ':' + clientSecret)}`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: scope || ''
      })
    });

    if (!response.ok) {
      throw new AtlasITError(
        'AUTH-004',
        'Failed to refresh OAuth2 token',
        500,
        { status: response.status, statusText: response.statusText }
      );
    }

    const data = await response.json() as { access_token: string; expires_in?: number };
    return data.access_token;
  }

  private getBasicAuthHeaders(config: AuthConfig): Record<string, string> {
    const { username, password } = config.credentials;

    if (!username || !password) {
      throw new AtlasITError(
        'AUTH-005',
        'Basic auth credentials not configured',
        500,
        { authType: 'basic' }
      );
    }

    const authHeader = `Basic ${btoa(username + ':' + password)}`;

    return {
      'Authorization': authHeader
    };
  }

  private getBearerHeaders(config: AuthConfig): Record<string, string> {
    const { token } = config.credentials;

    if (!token) {
      throw new AtlasITError(
        'AUTH-006',
        'Bearer token not configured',
        500,
        { authType: 'bearer' }
      );
    }

    return {
      'Authorization': `Bearer ${token}`
    };
  }

  private async getAwsSignatureHeaders(config: AuthConfig): Promise<Record<string, string>> {
    const { accessKeyId, secretAccessKey, region = 'us-east-1', service = 'iam' } = config.credentials;

    // Generate AWS Signature Version 4
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const headers = {
      'X-Amz-Date': amzDate,
      'Authorization': await this.generateAwsSignature(
        accessKeyId,
        secretAccessKey,
        region,
        service,
        amzDate,
        dateStamp
      )
    };

    return headers;
  }

  private async generateAwsSignature(
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
    service: string,
    amzDate: string,
    dateStamp: string
  ): Promise<string> {
    // AWS Signature Version 4 implementation
    // This is a simplified version - in production, you'd want a more robust implementation
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

    return `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=host;x-amz-date, Signature=placeholder`;
  }

  private getCustomHeaders(config: AuthConfig): Record<string, string> {
    const { headers } = config.credentials;

    if (!headers || typeof headers !== 'object') {
      throw new AtlasITError(
        'AUTH-007',
        'Custom headers not configured',
        500,
        { authType: 'custom' }
      );
    }

    return headers;
  }

  /**
   * Validate authentication configuration
   */
  validateAuthConfig(systemName: string): boolean {
    const config = this.authConfigs.get(systemName);
    if (!config) {
      return false;
    }

    try {
      switch (config.type) {
        case 'api-key':
          return !!(config.credentials.apiKey);

        case 'oauth2':
          return !!(config.credentials.clientId && config.credentials.clientSecret && config.credentials.tokenUrl);

        case 'basic':
          return !!(config.credentials.username && config.credentials.password);

        case 'bearer':
          return !!(config.credentials.token);

        case 'aws-sig':
          return !!(config.credentials.accessKeyId && config.credentials.secretAccessKey);

        case 'custom':
          return !!(config.credentials.headers);

        default:
          return false;
      }
    } catch (error) {
      logger.error('Auth config validation failed', error, { systemName });
      return false;
    }
  }

  /**
   * Get all registered systems
   */
  getRegisteredSystems(): string[] {
    return Array.from(this.authConfigs.keys());
  }

  /**
   * Clear token cache for a system
   */
  clearTokenCache(systemName: string): void {
    const cacheKey = `${this.tenantId}:${systemName}:oauth2`;
    this.tokenCache.delete(cacheKey);
    logger.info('Cleared token cache', { tenantId: this.tenantId, systemName });
  }

  /**
   * Update authentication configuration
   */
  updateAuthConfig(systemName: string, config: Partial<AuthConfig>): void {
    const existing = this.authConfigs.get(systemName);
    if (!existing) {
      throw new AtlasITError(
        'AUTH-008',
        `System not registered: ${systemName}`,
        400,
        { systemName }
      );
    }

    const updated = { ...existing, ...config };
    this.authConfigs.set(systemName, updated);

    // Clear cache if credentials changed
    if (config.credentials) {
      this.clearTokenCache(systemName);
    }

    logger.info('Updated authentication config', {
      tenantId: this.tenantId,
      systemName,
      authType: updated.type
    });
  }
}

// Global authentication manager instance
export const authManager = new AuthenticationManager('default');

// Helper function to get auth headers
export async function getSystemAuthHeaders(systemName: string): Promise<Record<string, string>> {
  return authManager.getAuthHeaders(systemName);
}

// Helper function to register system auth
export function registerSystemAuth(systemName: string, config: AuthConfig): void {
  authManager.registerAuth(systemName, config);
}
