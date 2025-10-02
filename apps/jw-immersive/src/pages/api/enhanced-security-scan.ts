import type { APIRoute } from 'astro';
import { initScans, getAvailableScanTypes, runScan, runFullScan, NoActiveScansError } from '../../../../../../Project-AtlasIT/src/runtime/scans/service.js';
import { getConfig } from '../../../../../../Project-AtlasIT/src/runtime/config/dynamicConfig.js';
import { registerRoute } from '../../../../../../Project-AtlasIT/src/runtime/routes/registerRoute.js';

const MAX_URL_LENGTH = 2048;
const BUILD_SUPER_ADMIN_KEY = process.env.SUPER_ADMIN_KEY || '';

registerRoute({ id: 'enhanced-security-scan', method: 'POST', path: '/api/enhanced-security-scan' });

interface ScanRequestBody {
  url?: string;
  type?: string;
  superAdminMode?: boolean;
  adminKey?: string;
}

interface JsonError {
  code: string;
  error: string;
}

export const POST: APIRoute = async (ctx) => {
  initScans();

  const runtimeEnv = (ctx.locals as any)?.runtime?.env ?? {};
  const mergedEnv = { ...(globalThis as any)?.process?.env, ...runtimeEnv } as Record<string, string>;

  let body: ScanRequestBody;
  try {
    body = (await ctx.request.json()) ?? {};
  } catch {
    return jsonError('BAD_JSON', 'Invalid JSON body', 400);
  }

  const url = body.url ?? body['target'];
  const type = body.type ?? body['scanType'];
  const superAdminMode = Boolean(body.superAdminMode);
  const adminKey = body.adminKey;

  if (!url || typeof url !== 'string') {
    return jsonError('MISSING_PARAMS', 'Missing url parameter', 400);
  }
  if (!type || typeof type !== 'string') {
    return jsonError('MISSING_PARAMS', 'Missing type parameter', 400);
  }
  if (url.length > MAX_URL_LENGTH) {
    return jsonError('URL_TOO_LONG', 'URL exceeds maximum length', 400);
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return jsonError('INVALID_URL', 'Invalid URL format', 400);
  }

  if (!['http:', 'https:'].includes(target.protocol)) {
    return jsonError('UNSUPPORTED_PROTOCOL', 'Only HTTP and HTTPS URLs are supported', 400);
  }

  if (superAdminMode) {
    const runtimeKey = mergedEnv.SUPER_ADMIN_KEY || mergedEnv.SUPER_ADMIN_KEY_DEV || '';
    const effectiveKey = runtimeKey || BUILD_SUPER_ADMIN_KEY;
    if (!effectiveKey) {
      return jsonError('ADMIN_KEY_NOT_CONFIGURED', 'Super admin key not configured on server', 500);
    }
    if (!adminKey || !timingSafeEqualStr(adminKey, effectiveKey)) {
      return jsonError('INVALID_ADMIN_KEY', 'Invalid admin key for super admin mode', 403);
    }
  }

  const config = await getConfig();
  const availableTypes = await getAvailableScanTypes(config);
  if (!availableTypes.includes(type)) {
    return jsonError('INVALID_SCAN_TYPE', 'Unsupported scan type', 400);
  }

  try {
    const context = { env: mergedEnv, superAdminMode };
    const result = type === 'full'
      ? await runFullScan(target.toString(), context, config)
      : await runScan(type, target.toString(), context, config);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    if (error instanceof NoActiveScansError) {
      return jsonError('NO_ACTIVE_SCANS', 'All scans disabled by configuration', 400);
    }
    console.error('[enhanced-security-scan] fatal', error);
    return jsonError('INTERNAL_ERROR', 'Internal server error', 500);
  }
};

function jsonError(code: string, message: string, status = 400): Response {
  const payload: JsonError = { code, error: message };
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
