import { describe, it, expect } from 'vitest';
import { GET as googleOAuthStart } from '../src/routes/api/oauth/google/+server';

describe('Google OAuth Start', () => {
	it('generates correct OAuth URL when configured', async () => {
		const mockEvent = {
			platform: {
				env: {
					OAUTH_GOOGLE_CLIENT_ID: 'test-client-id',
					SITE_URL: 'https://atlasit.app',
				},
			},
		} as any;

		const response = await googleOAuthStart(mockEvent);
		const data = await response.json();

		expect(data.url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
		expect(data.url).toContain('client_id=test-client-id');
		expect(data.url).toContain('redirect_uri=https%3A%2F%2Fatlasit.app%2Fapi%2Foauth%2Fgoogle%2Fcallback');
		expect(data.url).toContain('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fadmin.directory.user');
		expect(data.state).toBeDefined();
		expect(typeof data.state).toBe('string');
	});

	it('returns error when not configured', async () => {
		const mockEvent = {
			platform: {
				env: {},
			},
		} as any;

		const response = await googleOAuthStart(mockEvent);
		const data = await response.json();

		expect(response.status).toBe(503);
		expect(data.error).toContain('not configured');
	});
});
