'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  goToPage,
  isOwnLink,
  pageArrived,
  prefetchPage,
  resetPageTransition,
  setPageRouter,
} from '@/lib/dimensions/pageTransition';

/** The link inside the shell that an event came from, if any. */
const linkOf = (target: EventTarget | null) => {
  const a =
    target instanceof Element
      ? target.closest<HTMLAnchorElement>('a[href]')
      : null;
  return a?.closest('.dim') ? a : null;
};

/**
 * Makes going from one page of the shell to another a transition (pageTransition.ts). It belongs to the shell
 * layout, so it is there on every page and outlives any one of them, and it renders nothing.
 *
 * Every link inside `.dim` is followed here, whoever rendered it: the bar, the footer, the breadcrumb, the
 * "next" and "more" links. A link that has its own handler (the bar's, for the sheet and the section jumps)
 * has been dealt with by then, and is left alone. So is every click that is the browser's own: with Ctrl, Meta,
 * Shift or Alt, with another button, to a new tab, a download, another site.
 */
export const PageTransitions = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => setPageRouter(router), [router]);

  // before the new page is painted: its entrance is held under the cover from its first frame
  useLayoutEffect(() => pageArrived(pathname), [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = linkOf(e.target);
      if (a && isOwnLink(a) && goToPage(a.href)) e.preventDefault();
    };
    // pointed at, or reached with the keyboard: the page is fetched before the click
    const onNear = (e: Event) => {
      const a = linkOf(e.target);
      if (a) prefetchPage(a.href);
    };
    // Restored from the back/forward cache, the page is as it was left: never in the middle of a step.
    // (Only then: the first `pageshow` of a load can come late enough to fall into a step already asked for.)
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) resetPageTransition();
    };
    document.addEventListener('click', onClick);
    document.addEventListener('pointerover', onNear, { passive: true });
    document.addEventListener('focusin', onNear);
    // a step through the history is never held up: whatever was under way is given up
    window.addEventListener('popstate', resetPageTransition);
    window.addEventListener('pageshow', onShow);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('pointerover', onNear);
      document.removeEventListener('focusin', onNear);
      window.removeEventListener('popstate', resetPageTransition);
      window.removeEventListener('pageshow', onShow);
      // the shell itself is going (a legacy page): nothing of a step may outlive it
      resetPageTransition();
    };
  }, []);

  return null;
};
