'use client';

import { useTranslation } from 'react-i18next';
import { SiteBar } from '#/dimensions/SiteBar';
import { SiteFooter } from '#/dimensions/SiteFooter';
import { InnerHeader } from '#/dimensions/InnerHeader';
import { OpenSourceList } from '#/dimensions/OpenSourceList';

import '@/styles/dimensions/pages/openSource.css';

export default function OpenSourcePage() {
  const { t } = useTranslation();
  return (
    <div className='dim'>
      <link rel='canonical' href='https://mc-ctec.org/openSource/' />
      <SiteBar variant='inner' />
      <main>
        <InnerHeader
          image='/assets/openSource/CTEC_Development.webp'
          dim='end'
          crumbs={[
            { href: '/', label: t('dimensions.nav.homeShort') },
            { href: '/#end', label: t('dimensions.nav.end') },
            { label: t('dimensions.openSource.crumb') },
          ]}
          title={
            t('dimensions.openSource.title', {
              returnObjects: true,
            }) as string[]
          }
          lead={t('dimensions.openSource.lead')}
          label={t('dimensions.dim.end')}
        />
        <OpenSourceList />
        <div className='next'>
          <span className='mono' data-t='note'>
            {t('dimensions.nextLabel')}
          </span>
          {/* a plain link on purpose: the shell takes the step from here, as a transition (PageTransitions) */}
          <a className='serif' href='/partner/' data-t='title'>
            {t('dimensions.openSource.next')} →
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
