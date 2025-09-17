import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

export interface AtlasITEnv {
  D1_DB: D1Database;
  KV_ATLASIT: KVNamespace;
  R2_BUCKET: R2Bucket;
  OAUTH_GOOGLE_CLIENT_ID: string;
  OAUTH_GOOGLE_CLIENT_SECRET: string;
  OAUTH_ENTRA_CLIENT_ID: string;
  OAUTH_ENTRA_CLIENT_SECRET: string;
  SITE_URL: string;
}

export function getConfig(env: any): AtlasITEnv {
  return {
    D1_DB: env.D1_DB,
    KV_ATLASIT: env.KV_ATLASIT,
    R2_BUCKET: env.R2_BUCKET,
    OAUTH_GOOGLE_CLIENT_ID: env.OAUTH_GOOGLE_CLIENT_ID,
    OAUTH_GOOGLE_CLIENT_SECRET: env.OAUTH_GOOGLE_CLIENT_SECRET,
    OAUTH_ENTRA_CLIENT_ID: env.OAUTH_ENTRA_CLIENT_ID,
    OAUTH_ENTRA_CLIENT_SECRET: env.OAUTH_ENTRA_CLIENT_SECRET,
    SITE_URL: env.SITE_URL
  };
}
