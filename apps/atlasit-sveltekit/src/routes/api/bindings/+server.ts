import { json, type RequestEvent } from '@sveltejs/kit';

type BindingEnv = Partial<{
	SITE_URL: string;
	D1_DB: unknown;
	SESSION: unknown;
	R2_BUCKET: unknown;
}>;

const hasString = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const hasBinding = (value: unknown) => value !== undefined && value !== null;

export const GET = (event: RequestEvent) => {
	const env = (event.platform?.env as BindingEnv | undefined) ?? {};

	return json(
		{
			SITE_URL: hasString(env.SITE_URL),
			D1_DB_BOUND: hasBinding(env.D1_DB),
			SESSION_BOUND: hasBinding(env.SESSION),
			R2_BUCKET_BOUND: hasBinding(env.R2_BUCKET),
		},
		{
			headers: {
				'cache-control': 'no-store',
			},
		},
	);
};
