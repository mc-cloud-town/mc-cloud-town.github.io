/** JSON-LD builders shared by the inner pages' (server) `page.tsx`. Every field here must trace to data the
    page already has — the same `crumbs` InnerHeader renders, the same collection/video data the client fetches. */

const ORIGIN = 'https://mc-ctec.org';

export interface Crumb {
  href?: string;
  label: string;
}

/** The page's own crumbs (the same array handed to InnerHeader) as a BreadcrumbList ending at `canonical`. */
export const breadcrumbJsonLd = (crumbs: Crumb[], canonical: string) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.label,
    item: c.href ? `${ORIGIN}${c.href}` : canonical,
  })),
});

/** One real, attributed, dated creative work from the redstone/architecture collections, as an ItemList. */
export const collectionItemListJsonLd = (
  items: { title: string; creators: string[]; date: string; image: string }[],
  name: string,
) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  numberOfItems: items.length,
  itemListElement: items.map((w, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'CreativeWork',
      name: w.title,
      creator: w.creators.map((c) => ({ '@type': 'Person', name: c })),
      ...(w.date && { dateCreated: w.date.replace(/\./g, '-') }),
      image: w.image,
    },
  })),
});

/** The home hero's real anniversary video (`home.backgroundVideo.youtubeId`), as a VideoObject. No `uploadDate`
    — it isn't known, and guessing it would be worse than omitting it. */
export const heroVideoJsonLd = (
  id: string,
  name: string,
  description: string,
) => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name,
  description,
  thumbnailUrl: [`https://img.youtube.com/vi/${id}/maxresdefault.jpg`],
  embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
});
