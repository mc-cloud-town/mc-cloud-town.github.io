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

  // Before the new page is painted: its entrance is held under the cover from its first frame.
  // (A layout effect of the shell layout, after the page's own: see `pageArrived` for what that order is to it.)
  useLayoutEffect(() => pageArrived(pathname), [pathname]);

  // The shell itself is going (a step to a legacy page): nothing of the step may outlive it. As a layout effect's
  // cleanup, so that it happens while the shell is taken out of the document and before the router puts the
  // legacy page at its top: a hold that was still there when the browser tells the page of that scroll would
  // put the legacy page back where the reader had been on the page before.
  useLayoutEffect(() => resetPageTransition, []);

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
    };
  }, []);

  return null;
};
