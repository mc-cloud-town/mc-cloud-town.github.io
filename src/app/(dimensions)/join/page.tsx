'use client';

import { useTranslation } from 'react-i18next';
import { SiteBar } from '#/dimensions/SiteBar';
import { SiteFooter } from '#/dimensions/SiteFooter';
import { InnerHeader } from '#/dimensions/InnerHeader';
import { JoinGuide } from '#/dimensions/JoinGuide';

import '@/styles/dimensions/pages/join.css';

export default function Page() {
  const { t } = useTranslation();
  return (
    <div className='dim'>
      <SiteBar variant='inner' current='join' />
      <main>
        <InnerHeader
          image='/assets/join/CTEC_Lounge.webp'
          dim='respawn'
          crumbs={[
            { href: '/', label: t('dimensions.nav.homeShort') },
            { href: '/#respawn', label: t('dimensions.respawn.label') },
            { label: t('dimensions.nav.join') },
          ]}
          title={
            t('dimensions.join.title', { returnObjects: true }) as string[]
          }
          lead={t('dimensions.join.lead')}
          label={t('dimensions.join.label')}
        />
        <JoinGuide />
        <div className='next'>
          <span className='mono' data-t='note'>
            {t('dimensions.nextLabel')}
          </span>
          {/* a plain link on purpose: the shell takes the step from here, as a transition (PageTransitions) */}
          <a className='serif' href='/survivalProgress/' data-t='title'>
            {t('dimensions.join.next')} →
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
