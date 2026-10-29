import { fullTitle, socialImagePath, type PageMeta } from '../data/pageMeta';
import { site } from '../data/site';

/**
 * Per-route metadata. React 19 hoists <title>, <meta> and <link> rendered anywhere in the
 * tree into <head>. The static copies in the built HTML (for crawlers that don't run
 * JavaScript) are removed at startup in main.tsx, so each page ends up with exactly one set.
 *
 * Indexing: the demo/preview build is never indexed (placeholder content must not appear in
 * search results). Individual pages can also opt out (404, sample projects).
 */
export function Seo({ meta }: { meta: PageMeta }) {
  const title = fullTitle(meta);
  const canonical = site.siteUrl ? `${site.siteUrl}${meta.path === '/' ? '/' : meta.path}` : null;
  const image = site.siteUrl ? `${site.siteUrl}${socialImagePath}` : socialImagePath;
  const noindex = site.demoMode || meta.noindex;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={meta.description} />
      {noindex && <meta name="robots" content="noindex" />}
      {canonical && !meta.noindex && <link rel="canonical" href={canonical} />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:locale" content="en" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="SAN Construction: an illustrated mid-rise building at dusk" />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
}
