'use client';

import { useTranslation } from 'react-i18next';
import useApi from '@/hooks/useApi';
import { STATIC_DATA_API } from '@/constants';
import type { IImageContent } from '@/types/IImageContent';
import { SiteBar } from '#/dimensions/SiteBar';
import { SiteFooter } from '#/dimensions/SiteFooter';
import { InnerHeader } from '#/dimensions/InnerHeader';
import { ProgressLog } from '#/dimensions/ProgressLog';

export default function ProgressPage() {
  const { t, i18n } = useTranslation();
  const { data, loading, error } = useApi<IImageContent[]>(
    `${STATIC_DATA_API}/${i18n.language}/survivalProgress.json`,
  );
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
          lead={
            data
              ? t('dimensions.progress.lead', { total: data.length })
              : t('dimensions.progress.leadPlain')
          }
          label={t('dimensions.dim.all')}
        />
        <ProgressLog data={data} loading={loading} error={error} />
        <div className='next'>
          <span className='mono' data-t='note'>
            {t('dimensions.nextLabel')}
          </span>
          <a className='serif' href='/member/' data-t='title'>
            {t('dimensions.progress.next')} →
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
