'use client';

import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { SiteBar } from './SiteBar';
import { SiteFooter } from './SiteFooter';

import '@/styles/dimensions/pages/notFound.css';

/** Where a lost reader can go: the home page and the main pages, by their words in the bar. */
const WAYS = [
  ['/survivalProgress/', 'dimensions.nav.progress'],
  ['/member/', 'dimensions.nav.members'],
  ['/join/', 'dimensions.nav.join'],
] as const;

/**
 * The page for an address that leads nowhere: the void. No dimension accent and no picture, near-black in
 * both themes (the End on the home page is dark by day as well, and the void follows it); a short message
 * and the ways back. Rendered inside the shell's pieces by `app/not-found.tsx`.
 */
export const NotFoundView = () => {
  const { t } = useTranslation();
  const title = t('dimensions.notFound.title', {
    returnObjects: true,
  }) as string[];
  return (
    <div className='dim dim--void'>
      <SiteBar variant='inner' />
      <main>
        <section className='void'>
          <p className='mono' data-t='note'>
            {t('dimensions.notFound.code')} / {t('dimensions.notFound.label')}
          </p>
          <h1 className='serif' data-t='title'>
            {title.map((line, i) => (
              // by its place, not by its words (as InnerHeader does)
              <span key={i} style={{ '--i': i } as CSSProperties}>
                {line}
              </span>
            ))}
          </h1>
          <p data-t='body'>{t('dimensions.notFound.body')}</p>
          <nav className='ways' aria-label={t('dimensions.notFound.more')}>
            {/* plain links on purpose: the shell takes the step from here, as a transition (PageTransitions) */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href='/' data-t='control' className='home'>
              {t('dimensions.notFound.home')} →
            </a>
            <span className='mono' data-t='note'>
              {t('dimensions.notFound.more')}
            </span>
            {WAYS.map(([href, key]) => (
              <a key={href} href={href} data-t='control'>
                {t(key)}
              </a>
            ))}
          </nav>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};
