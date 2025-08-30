import { siteMeta } from "../data/siteMeta";

export async function GET() {
  const posts = import.meta.glob("./blog/*.{md,mdx}", { eager: true });
  const items = Object.entries(posts)
    .map(([path, mod]) => {
      const fm = mod.frontmatter || {};
      if (!fm.title) return null;
      const fileSlug = path
        .split("/")
        .pop()
        .replace(/\.(md|mdx)$/, "");
      const slug = fm.slug || fileSlug;
      return {
        id: slug,
        title: fm.title,
        url: `${siteMeta.siteUrl}/blog/${slug}/`,
        content_text: fm.description || "",
        summary: fm.description || "",
        date_published: fm.pubDate,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date_published) - new Date(a.date_published));

  const feed = {
    version: "https://jsonfeed.org/version/1",
    title: siteMeta.defaultTitle,
    home_page_url: siteMeta.siteUrl,
    feed_url: `${siteMeta.siteUrl}/feed.json`,
    description: siteMeta.description,
    items,
  };

  // Response is a global in Astro/Node.js environment
  return new Response(JSON.stringify(feed, null, 2), {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" },
  });
}
