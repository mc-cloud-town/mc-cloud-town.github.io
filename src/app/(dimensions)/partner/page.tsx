'use client';

import { useTranslation } from 'react-i18next';
import { SiteBar } from '#/dimensions/SiteBar';
import { SiteFooter } from '#/dimensions/SiteFooter';
import { InnerHeader } from '#/dimensions/InnerHeader';
import { PartnerList } from '#/dimensions/PartnerList';

import '@/styles/dimensions/pages/partner.css';

/** Also served as `/collaborative/` (the old site had both addresses for this one page). */
export default function PartnerPage() {
  const { t } = useTranslation();
  return (
    <div className='dim'>
      <SiteBar variant='inner' />
      <main>
        <InnerHeader
          image='/assets/partner/partner.webp'
          dim='end'
          crumbs={[
            { href: '/', label: t('dimensions.nav.homeShort') },
            { href: '/#end', label: t('dimensions.nav.end') },
            { label: t('dimensions.partner.crumb') },
          ]}
          title={
            t('dimensions.partner.title', { returnObjects: true }) as string[]
          }
          lead={t('dimensions.partner.lead')}
          label={t('dimensions.dim.end')}
        />
        <PartnerList />
        <div className='next'>
          <span className='mono' data-t='note'>
            {t('dimensions.nextLabel')}
          </span>
          {/* a plain link on purpose: the shell takes the step from here, as a transition (PageTransitions) */}
          <a className='serif' href='/join/' data-t='title'>
            {t('dimensions.partner.next')} →
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
