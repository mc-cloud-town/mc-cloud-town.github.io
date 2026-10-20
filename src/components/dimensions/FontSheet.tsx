'use client';

import { usePathname } from 'next/navigation';
import { pageKind } from '@/lib/dimensions/pages';

/** The stylesheet of the site's faces, at Google Fonts: over eight hundred `@font-face` rules, a megabyte of them. */
export const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100..900&family=Noto+Serif+TC:wght@200..900&family=Chiron+Sung+HK:wght@700;900&family=Chiron+Hei+HK:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap';
/** The mark of the link the home page's script puts in the document. */
const LATER_ID = 'ctec-fonts';

/**
 * Runs while the served home page is parsed: asks for the stylesheet with a link made by script, which the
 * browser does not hold the first paint for. Not if the document has the stylesheet already. The address and
 * the mark are read from the script's own attributes: no value is written into the source.
 */
const laterScript = `(function(){try{var d=document,s=d.currentScript,h=s.getAttribute('data-href'),a=d.querySelectorAll('link[rel="stylesheet"]'),i=0;for(;i<a.length;i++)if(a[i].getAttribute('href')===h)return;var l=d.createElement('link');l.rel='stylesheet';l.href=h;l.id=s.getAttribute('data-id');d.head.appendChild(l)}catch(e){}})();`;

/**
 * The stylesheet of the site's faces, asked for page by page.
 *
 * On every page but the home page it is an ordinary stylesheet link in the head, which the browser waits for
 * before it paints anything: the page is first seen in its own faces, never in others that are then exchanged.
 *
 * On the home page nothing waits for it. The first thing painted there is the loader, which needs no face of the
 * web (its two lines are in a face of the system, home.css) and covers everything else; held back by this
 * stylesheet, on another origin and a megabyte long, it came seconds late on a slow line and never while that
 * origin did not answer. So the home page asks for it by script (and, with scripts off, the plain way), and the
 * loader counts it and the font files among what it waits for (`fontSheetIn`, Loader.tsx): the page is still
 * revealed in its own faces, as long as they come within the loader's own limit.
 *
 * A reader who goes from the home page to another page of the site has the stylesheet by then: the link of that
 * page is found loaded.
 */
export const FontSheet = () =>
  pageKind(usePathname()) === 'home' ? (
    <>
      <script
        data-href={FONTS_HREF}
        data-id={LATER_ID}
        dangerouslySetInnerHTML={{ __html: laterScript }}
      />
      <noscript>
        <link rel='stylesheet' href={FONTS_HREF} />
      </noscript>
    </>
  ) : (
    // (with a precedence React puts it in the head, and holds the page back until it is in)
    <link rel='stylesheet' href={FONTS_HREF} precedence='fonts' />
  );

/**
 * The stylesheet the home page asked for by script is in (or has failed, which is no reason to wait), and the
 * page has been laid out with it, so that the browser knows which font files it wants. At once where the
 * document has the stylesheet by other means (a step to the home page from another page of the site).
 */
export const fontSheetIn = () =>
  new Promise<void>((done) => {
    const link = document.getElementById(LATER_ID) as HTMLLinkElement | null;
    if (!link || link.sheet) return done();
    // two frames on: the first lays the page out with the faces, and the files are asked for by then
    const laidOut = () =>
      requestAnimationFrame(() => requestAnimationFrame(() => done()));
    link.addEventListener('load', laidOut, { once: true });
    link.addEventListener('error', () => done(), { once: true });
  });
