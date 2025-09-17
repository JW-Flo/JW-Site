import { describe, it, expect } from 'vitest';
import { GET as entraOAuthStart } from '../src/routes/api/oauth/entra/+server';

describe('Entra OAuth Start', () => {
	it('generates correct OAuth URL when configured', async () => {
		const mockEvent = {
			platform: {
				env: {
					OAUTH_ENTRA_CLIENT_ID: 'test-entra-client-id',
					SITE_URL: 'https://atlasit.app',
				},
			},
		} as any;

		const response = await entraOAuthStart(mockEvent);
		const data = await response.json();

		expect(data.url).toContain('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
		expect(data.url).toContain('client_id=test-entra-client-id');
		expect(data.url).toContain('redirect_uri=https%3A%2F%2Fatlasit.app%2Fapi%2Foauth%2Fentra%2Fcallback');
		expect(data.url).toContain('scope=https%3A%2F%2Fgraph.microsoft.com%2F.default+offline_access');
		expect(data.state).toBeDefined();
		expect(typeof data.state).toBe('string');
	});

	it('returns error when not configured', async () => {
		const mockEvent = {
			platform: {
				env: {},
			},
		} as any;

		const response = await entraOAuthStart(mockEvent);
		const data = await response.json();

		expect(response.status).toBe(503);
		expect(data.error).toContain('not configured');
	});
});
