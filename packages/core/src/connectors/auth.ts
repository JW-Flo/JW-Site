import { createHash, randomBytes } from 'node:crypto';

export interface FetchLikeResponse {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export type FetchLike = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
) => Promise<FetchLikeResponse>;

export const getDefaultFetch = (): FetchLike => {
  const fetchImpl = (globalThis as unknown as { fetch?: FetchLike }).fetch;
  if (!fetchImpl) {
    throw new Error('Global fetch implementation is not available');
  }
  return fetchImpl.bind(globalThis) as FetchLike;
};

export interface OAuth2AuthorizationParams {
  authorizationUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
  extras?: Record<string, string | undefined>;
}

export const buildOAuth2AuthorizationUrl = (params: OAuth2AuthorizationParams): string => {
  const {
    authorizationUrl,
    clientId,
    redirectUri,
    scopes,
    state,
    codeChallenge,
    codeChallengeMethod = 'S256',
    extras = {},
  } = params;

  const url = new URL(authorizationUrl);
  const search = url.searchParams;
  search.set('response_type', 'code');
  search.set('client_id', clientId);
  search.set('redirect_uri', redirectUri);
  search.set('scope', scopes.join(' '));

  if (state) {
    search.set('state', state);
  }

  if (codeChallenge) {
    search.set('code_challenge', codeChallenge);
    search.set('code_challenge_method', codeChallengeMethod);
  }

  for (const [key, value] of Object.entries(extras)) {
    if (typeof value !== 'undefined') {
      search.set(key, value);
    }
  }

  return url.toString();
};

export interface OAuth2TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  issuedTokenType?: string;
  scope?: string;
  tokenType?: string;
  obtainedAt: Date;
  raw: Record<string, unknown>;
}

const toTokenResponse = (payload: Record<string, unknown>): OAuth2TokenResponse => {
  const accessToken = payload['access_token'];
  if (typeof accessToken !== 'string') {
    throw new Error('OAuth2 token response is missing access_token');
  }

  return {
    accessToken,
    refreshToken: typeof payload['refresh_token'] === 'string' ? payload['refresh_token'] : undefined,
    expiresIn: typeof payload['expires_in'] === 'number' ? payload['expires_in'] : undefined,
    issuedTokenType: typeof payload['issued_token_type'] === 'string' ? payload['issued_token_type'] : undefined,
    scope: typeof payload['scope'] === 'string' ? payload['scope'] : undefined,
    tokenType: typeof payload['token_type'] === 'string' ? payload['token_type'] : undefined,
    obtainedAt: new Date(),
    raw: payload,
  };
};

const doTokenRequest = async (
  url: string,
  params: Record<string, string>,
  fetchImpl?: FetchLike,
  headers: Record<string, string> = {}
): Promise<OAuth2TokenResponse> => {
  const fetchFn = fetchImpl ?? getDefaultFetch();
  const body = new URLSearchParams(params).toString();
  const response = await fetchFn(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      ...headers,
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const err = new Error(`OAuth2 token request failed with status ${response.status}`);
    (err as Error & { details?: string }).details = errorBody;
    throw err;
  }

  const json = await response.json();
  return toTokenResponse(json as Record<string, unknown>);
};

export interface OAuth2CodeExchangeParams {
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  code: string;
  redirectUri: string;
  codeVerifier?: string;
  extras?: Record<string, string>;
  fetchImpl?: FetchLike;
}

export const exchangeOAuth2CodeForToken = async (
  params: OAuth2CodeExchangeParams
): Promise<OAuth2TokenResponse> => {
  const { tokenUrl, clientId, clientSecret, code, redirectUri, codeVerifier, extras = {}, fetchImpl } = params;

  const requestParams: Record<string, string> = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    ...extras,
  };

  const headers: Record<string, string> = {};

  if (clientSecret) {
    requestParams['client_secret'] = clientSecret;
  }

  if (codeVerifier) {
    requestParams['code_verifier'] = codeVerifier;
  }

  return doTokenRequest(tokenUrl, requestParams, fetchImpl, headers);
};

export interface OAuth2RefreshParams {
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  refreshToken: string;
  extras?: Record<string, string>;
  fetchImpl?: FetchLike;
}

export const refreshOAuth2Token = async (params: OAuth2RefreshParams): Promise<OAuth2TokenResponse> => {
  const { tokenUrl, clientId, clientSecret, refreshToken, extras = {}, fetchImpl } = params;

  const requestParams: Record<string, string> = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    ...extras,
  };

  if (clientSecret) {
    requestParams['client_secret'] = clientSecret;
  }

  return doTokenRequest(tokenUrl, requestParams, fetchImpl);
};

export interface PkcePair {
  verifier: string;
  challenge: string;
}

const base64UrlEncode = (buffer: Buffer): string =>
  buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export const createPkcePair = (): PkcePair => {
  const verifier = base64UrlEncode(randomBytes(32));
  const challenge = base64UrlEncode(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
};

export const createBasicAuthHeader = (username: string, password: string): string => {
  const encoded = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${encoded}`;
};

export interface ApiKeyOptions {
  headerName?: string;
  queryName?: string;
}

export interface ApplyApiKeyResult {
  headers: Record<string, string>;
  searchParams: URLSearchParams;
}

export const applyApiKey = (
  url: string,
  apiKey: string,
  options: ApiKeyOptions = {}
): ApplyApiKeyResult => {
  const target = new URL(url, 'http://placeholder.local');
  const headers: Record<string, string> = {};
  const searchParams = target.searchParams;

  if (options.headerName) {
    headers[options.headerName] = apiKey;
  } else if (options.queryName) {
    searchParams.set(options.queryName, apiKey);
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return { headers, searchParams };
};
