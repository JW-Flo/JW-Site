import { siteMeta } from "../../data/siteMeta";

export const prerender = true;

const postModules = import.meta.glob("../blog/*.{md,mdx}", { eager: true });

export async function getStaticPaths() {
  const posts = import.meta.glob("../blog/*.{md,mdx}");
  return Object.keys(posts).map((p) => {
    const slug = p
      .split("/")
      .pop()
      .replace(/\.(md|mdx)$/, "");
    return { params: { slug } };
  });
}

export async function GET({ params }) {
  const slug = params.slug;
  // Dynamically import the post to get frontmatter (best effort)
  let title = siteMeta.defaultTitle;
  let description = siteMeta.description;
  for (const [path, mod] of Object.entries(postModules)) {
    const fileSlug = path
      .split("/")
      .pop()
      .replace(/\.(md|mdx)$/, "");
    if (fileSlug === slug && mod.frontmatter) {
      title = mod.frontmatter.title || title;
      description = mod.frontmatter.description || description;
      break;
    }
  }
  const safe = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' viewBox='0 0 1200 630'>\n  <defs>\n    <linearGradient id='grad' x1='0' x2='1' y1='0' y2='1'>\n      <stop offset='0%' stop-color='#0f766e'/>\n      <stop offset='100%' stop-color='#0d4f4a'/>\n    </linearGradient>\n  </defs>\n  <rect width='1200' height='630' fill='url(#grad)'/>\n  <text x='80' y='220' font-family='system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif' font-size='70' font-weight='700' fill='white'>${safe(
    title
  )}</text>\n  <text x='80' y='300' font-family='system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif' font-size='34' fill='#b2f5ea'>${safe(
    description
  )}</text>\n  <text x='80' y='560' font-family='system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif' font-size='26' fill='#ccfbf1'>${siteMeta.siteUrl.replace(
    "https://",
    ""
  )}</text>\n</svg>`;
  // Response is a global in Astro/Node.js environment
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
}
