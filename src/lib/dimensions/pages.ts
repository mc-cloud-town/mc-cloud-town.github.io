import type { Dimension } from '#/dimensions/DimensionProvider';

/**
 * The dimension each page of the shell belongs to, by its path without slashes. Every page that is not named here
 * is in the overworld (the home page starts there; its choreography reports where the reader is from then on).
 */
const PAGE_DIMENSIONS: Record<string, Dimension> = {
  member: 'end',
};

/** A path without its slashes: `/member/` and `/member` are the same page. */
const bare = (path: string) => path.split('/').filter(Boolean).join('/');

export const samePath = (a: string, b: string) => bare(a) === bare(b);

export const dimensionOfPath = (path: string): Dimension =>
  PAGE_DIMENSIONS[bare(path)] ?? 'overworld';

/** The home page's entrance is its loader; an inner page's is its header (inner.css). */
export type PageKind = 'home' | 'inner';

/** The pages of the new shell, by bare path: what a step from one to another arrives on. */
const SHELL_PAGES = new Map<string, PageKind>([
  ['', 'home'],
  ['home', 'home'],
  ['member', 'inner'],
  ['survivalProgress', 'inner'],
  ['survival', 'inner'],
]);

/** What kind of page of the shell a path leads to; nothing if it is not one of them. */
export const pageKind = (path: string) => SHELL_PAGES.get(bare(path));

/**
 * Runs while the served HTML is parsed, before anything of the shell is painted and long before hydration:
 * `<html data-dim>` carries the page's accent and turns the site's smooth scrolling off (shell.css), and both
 * must hold from the first frame. Same rule as `dimensionOfPath`; DimensionProvider keeps the attribute from then on.
 */
export const dimensionInitScript = `(function(){try{var m=${JSON.stringify(
  PAGE_DIMENSIONS,
)},p=location.pathname.split('/').filter(Boolean).join('/');document.documentElement.setAttribute('data-dim',m[p]||'overworld')}catch(e){}})();`;
