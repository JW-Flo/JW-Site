import { describe, expect, it } from 'vitest';
import { GET as bindingsProbe } from '../src/routes/api/bindings/+server';

describe('/api/bindings', () => {
	it('returns true for bound resources and prevents caching', async () => {
		const response = await bindingsProbe({
			platform: {
				env: {
					SITE_URL: 'https://atlasit.app',
					D1_DB: {},
					SESSION: {},
					R2_BUCKET: {},
				},
			},
		} as any);

		expect(response.headers.get('cache-control')).toBe('no-store');

		const payload = await response.json();

		expect(payload).toEqual({
			SITE_URL: true,
			D1_DB_BOUND: true,
			SESSION_BOUND: true,
			R2_BUCKET_BOUND: true,
		});
	});

	it('returns false when bindings are missing', async () => {
		const response = await bindingsProbe({} as any);
		const payload = await response.json();

		expect(payload).toEqual({
			SITE_URL: false,
			D1_DB_BOUND: false,
			SESSION_BOUND: false,
			R2_BUCKET_BOUND: false,
		});
	});

	it('treats an empty SITE_URL as unbound', async () => {
		const response = await bindingsProbe({
			platform: {
				env: {
					SITE_URL: '   ',
				},
			},
		} as any);

		const payload = await response.json();
		expect(payload.SITE_URL).toBe(false);
	});
});
