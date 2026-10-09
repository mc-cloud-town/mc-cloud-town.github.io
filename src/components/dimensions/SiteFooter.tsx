'use client';

import { useId, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { serverLink } from '@/constants';

/**
 * The pages of the site that are still in the old shell, with the words the old navigation and the pages
 * themselves already use for them. (`/collaborative/` is `/partner/` under another address: one link.)
 * A click on one is a step out of the shell: the leave half of a page transition (pageTransition.ts).
 */
const PAGES = [
  ['/redstoneCollection/', 'menu.redstone'],
  ['/architectureCollection/', 'menu.building'],
  ['/openSource/', 'menu.openSource'],
  ['/hardware/', 'hardware.title'],
  ['/partner/', 'menu.partner'],
  ['/join/', 'menu.join'],
] as const;

/** The year of the build (next.config.ts): what the served page says, and what the first render must say too. */
const BUILD_YEAR = Number(process.env.NEXT_PUBLIC_BUILD_YEAR);
const builtIn = () => BUILD_YEAR;
const thisYear = () => new Date().getFullYear();
const noSubscription = () => () => {};

export const SiteFooter = () => {
  const { t } = useTranslation();
  const label = useId();
  // the reader's own year, once the page is theirs: read in the browser only, so a page that was built last year
  // and is opened this year hydrates as it was served and then says this year
  const year = useSyncExternalStore(noSubscription, thisYear, builtIn);
  return (
    <footer className='dim-foot'>
      {/* a line of its own above the footer's: a named group, its words set like the links below (shell.css) */}
      <nav className='pages' aria-labelledby={label}>
        <span className='label mono' id={label} data-t='note'>
          {t('dimensions.footer.more')}
        </span>
        {PAGES.map(([href, key]) => (
          <a key={href} href={href} data-t='control'>
            {t(key)}
          </a>
        ))}
      </nav>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src='/assets/brand/brand1.webp' alt='雲鎮工藝 CTEC' />
      {/* one line of words: the space between them is the line's own (shell.css) */}
      <div className='links'>
        <a href={serverLink.discord} data-t='control'>
          Discord
        </a>
        <a href={serverLink.youtube} data-t='control'>
          YouTube
        </a>
        {/* a single letter: narrower than the box a finger needs, so it says so (shell.css) */}
        <a href={serverLink.x} data-t='control' data-short>
          X
        </a>
        <a href='https://github.com/mc-cloud-town' data-t='control'>
          GitHub
        </a>
        <a href={serverLink.paypal} data-t='control'>
          {t('dimensions.footer.support')}
        </a>
      </div>
      <span data-t='note'>{t('dimensions.footer.rights', { year })}</span>
    </footer>
  );
};
