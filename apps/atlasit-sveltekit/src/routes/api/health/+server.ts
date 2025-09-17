import { json, type RequestEvent } from '@sveltejs/kit';

export const GET = async (event: RequestEvent) => {
	const siteUrl = event.platform?.env?.SITE_URL || 'https://atlasit.app';
	return json({ status: 'ok', timestamp: new Date().toISOString(), siteUrl });
};
