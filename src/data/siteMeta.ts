// SITE_URL must be supplied via environment (Cloudflare Pages or local .env).
// Fallback is only for local dev; do not rely on it for production canonical URLs.
const dynamicSiteUrl = import.meta.env.SITE_URL || 'http://localhost:4321';

export const siteMeta = {
  siteName: 'Joe Whittle',
  titleTemplate: '%s | Cybersecurity Engineer',
  defaultTitle: 'Joe Whittle | Cybersecurity Engineer',
  description: 'Cybersecurity engineer, builder, and explorer. Road‑tripping the US while securing systems.',
  siteUrl: dynamicSiteUrl, // dynamically set via env
  twitterHandle: '',
  author: 'Joe Whittle',
  sameAs: [
    'https://github.com/JW-Flo',
    'https://linkedin.com/in/joe-whittle',
    'https://awhittlewandering.com'
  ]
};

export function buildTitle(pageTitle?: string) {
  if (!pageTitle || pageTitle === siteMeta.defaultTitle) return siteMeta.defaultTitle;
  return siteMeta.titleTemplate.replace('%s', pageTitle);
}
