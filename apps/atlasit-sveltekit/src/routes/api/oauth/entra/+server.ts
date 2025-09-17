import { json, type RequestEvent } from '@sveltejs/kit';

export const GET = async (event: RequestEvent) => {
	const env = event.platform?.env;
	const clientId = env?.OAUTH_ENTRA_CLIENT_ID;
	const tenantId = 'common'; // or from env if needed
	const redirectUri = `${env?.SITE_URL || 'https://atlasit.app'}/api/oauth/entra/callback`;
	const scope = 'https://graph.microsoft.com/.default offline_access';

	if (!clientId) {
		return json(
			{
				error: 'Microsoft 365 integration is not configured yet.',
				instructions: 'Set OAUTH_ENTRA_CLIENT_ID and SITE_URL to enable production OAuth.',
			},
			{
				status: 503,
				headers: {
					'Cache-Control': 'no-store, max-age=0',
					Pragma: 'no-cache',
				},
			}
		);
	}

	const state = crypto.randomUUID();
	const params = new URLSearchParams({
		client_id: clientId,
		response_type: 'code',
		redirect_uri: redirectUri,
		scope,
		state,
		prompt: 'consent',
	});

	const cookie = `atlasit_oauth_m365_state=${state}; Path=/; HttpOnly; Secure; Max-Age=300; SameSite=Lax`;

	const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
	return json({ url, state }, {
		status: 200,
		headers: {
			'Set-Cookie': cookie,
			'Cache-Control': 'no-store, max-age=0',
			Pragma: 'no-cache',
		},
	});
};
