import rss from "@astrojs/rss";
import { siteMeta } from "../data/siteMeta";

export async function GET() {
  // Collect blog posts: any MD/MDX in /src/pages/blog except index
  const postImportResult = import.meta.glob("./blog/*.{md,mdx}", {
    eager: true,
  });
  const items = Object.entries(postImportResult)
    .map(([p, mod]) => {
      const frontmatter = mod.frontmatter || {};
      if (!frontmatter.title) return null;
      const fileSlug = p
        .split("/")
        .pop()
        .replace(/\.(md|mdx)$/, "");
      const slug = frontmatter.slug || fileSlug;
      const url = siteMeta.siteUrl.replace(/\/$/, "") + `/blog/${slug}/`;
      return {
        title: frontmatter.title,
        description: frontmatter.description,
        pubDate: frontmatter.pubDate && new Date(frontmatter.pubDate),
        link: url,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.pubDate || 0) - (a.pubDate || 0));

  return rss({
    title: siteMeta.defaultTitle,
    description: siteMeta.description,
    site: siteMeta.siteUrl,
    items,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
  });
}
