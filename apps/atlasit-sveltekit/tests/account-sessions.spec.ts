import { describe, expect, it, vi, afterEach } from 'vitest';
import { formatTimestamp, revokeAllSessions, revokeSession } from '../src/routes/account/sessions/helpers';

const createResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init });

describe('account sessions helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatTimestamp', () => {
    it('returns dash for empty values', () => {
      expect(formatTimestamp(undefined)).toBe('—');
      expect(formatTimestamp(null)).toBe('—');
    });

    it('passes through unparsable values', () => {
      expect(formatTimestamp('not-a-date')).toBe('not-a-date');
    });

    it('formats ISO strings using locale formatting', () => {
      const spy = vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('formatted-date');
      const result = formatTimestamp('2024-01-01T00:00:00.000Z');
      expect(result).toBe('formatted-date');
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('revokeSession', () => {
    it('refuses to call fetch when session id missing', async () => {
      const fetcher = vi.fn();
      const result = await revokeSession('', fetcher as any);
      expect(result).toEqual({ success: false, message: 'Session id is required' });
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('returns success when API responds ok', async () => {
      const fetcher = vi.fn().mockResolvedValue(createResponse({ ok: true }));
      const result = await revokeSession('abc', fetcher as any);
      expect(fetcher).toHaveBeenCalledWith('/api/auth/sessions/abc/revoke', { method: 'POST' });
      expect(result).toEqual({ success: true, message: 'Session revoked' });
    });

    it('returns API error message when available', async () => {
      const fetcher = vi.fn().mockResolvedValue(createResponse({ error: 'boom' }, { status: 400 }));
      const result = await revokeSession('abc', fetcher as any);
      expect(result).toEqual({ success: false, message: 'boom' });
    });

    it('falls back to default message when API payload missing', async () => {
      const fetcher = vi.fn().mockResolvedValue(new Response('not-json', { status: 500 }));
      const result = await revokeSession('abc', fetcher as any);
      expect(result).toEqual({ success: false, message: 'Failed to revoke session' });
    });
  });

  describe('revokeAllSessions', () => {
    it('returns success when API responds ok', async () => {
      const fetcher = vi.fn().mockResolvedValue(createResponse({ ok: true }));
      const result = await revokeAllSessions(fetcher as any);
      expect(fetcher).toHaveBeenCalledWith('/api/auth/sessions/revoke-all', { method: 'POST' });
      expect(result).toEqual({ success: true, message: 'All other sessions revoked' });
    });

    it('returns API error message when available', async () => {
      const fetcher = vi.fn().mockResolvedValue(createResponse({ error: 'nope' }, { status: 400 }));
      const result = await revokeAllSessions(fetcher as any);
      expect(result).toEqual({ success: false, message: 'nope' });
    });

    it('falls back to default message when API payload missing', async () => {
      const fetcher = vi.fn().mockResolvedValue(new Response('not-json', { status: 500 }));
      const result = await revokeAllSessions(fetcher as any);
      expect(result).toEqual({ success: false, message: 'Failed to revoke sessions' });
    });
  });
});
