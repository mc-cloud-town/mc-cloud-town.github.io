import type { Dimension } from '#/dimensions/DimensionProvider';

/**
 * The dimension each page of the shell belongs to, by its path without slashes. Every page that is not named here
 * is in the overworld (the home page starts there; its choreography reports where the reader is from then on).
 */
const PAGE_DIMENSIONS: Record<string, Dimension> = {
  member: 'end',
};

export const dimensionOfPath = (path: string): Dimension =>
  PAGE_DIMENSIONS[path.split('/').filter(Boolean).join('/')] ?? 'overworld';

/**
 * Runs while the served HTML is parsed, before anything of the shell is painted and long before hydration:
 * `<html data-dim>` carries the page's accent and turns the site's smooth scrolling off (shell.css), and both
 * must hold from the first frame. Same rule as `dimensionOfPath`; DimensionProvider keeps the attribute from then on.
 */
export const dimensionInitScript = `(function(){try{var m=${JSON.stringify(
  PAGE_DIMENSIONS,
)},p=location.pathname.split('/').filter(Boolean).join('/');document.documentElement.setAttribute('data-dim',m[p]||'overworld')}catch(e){}})();`;
