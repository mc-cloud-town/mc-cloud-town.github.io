'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { SiteBar } from '#/dimensions/SiteBar';
import { SiteFooter } from '#/dimensions/SiteFooter';
import { InnerHeader } from '#/dimensions/InnerHeader';
import { ProgressLog } from '#/dimensions/ProgressLog';

export default function ProgressPage() {
  const { t } = useTranslation();
  return (
    <div className='dim'>
      <SiteBar variant='inner' current='progress' />
      <main>
        <InnerHeader
          image='/assets/homePage/CTEC_Building.webp'
          dim='overworld'
          crumbs={[
            { href: '/', label: t('dimensions.nav.homeShort') },
            { label: t('dimensions.progress.crumb') },
          ]}
          title={
            t('dimensions.progress.title', { returnObjects: true }) as string[]
          }
          lead={t('dimensions.progress.lead', { total: 53 })}
          label={t('dimensions.dim.all')}
        />
        <ProgressLog />
        <div className='next'>
          <span className='mono' data-t='note'>
            {t('dimensions.nextLabel')}
          </span>
          <Link className='serif' href='/member/' data-t='title'>
            {t('dimensions.progress.next')} →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
