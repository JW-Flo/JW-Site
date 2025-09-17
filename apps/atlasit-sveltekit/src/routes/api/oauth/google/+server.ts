import { json, type RequestEvent } from '@sveltejs/kit';

export const GET = async (event: RequestEvent) => {
	const env = event.platform?.env;
	const clientId = env?.OAUTH_GOOGLE_CLIENT_ID;
	const redirectUri = `${env?.SITE_URL || 'https://atlasit.app'}/api/oauth/google/callback`;
	const scope = 'https://www.googleapis.com/auth/admin.directory.user';

	if (!clientId) {
		return json(
			{
				error: 'Google Workspace integration is not configured yet.',
				instructions: 'Set OAUTH_GOOGLE_CLIENT_ID and SITE_URL to enable production OAuth.',
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
		redirect_uri: redirectUri,
		response_type: 'code',
		access_type: 'offline',
		scope,
		state,
		prompt: 'consent',
		include_granted_scopes: 'true',
	});

	const cookie = `atlasit_oauth_google_state=${state}; Path=/; HttpOnly; Secure; Max-Age=300; SameSite=Lax`;

	const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
	return json({ url, state }, {
		status: 200,
		headers: {
			'Set-Cookie': cookie,
			'Cache-Control': 'no-store, max-age=0',
			Pragma: 'no-cache',
		},
	});
};
