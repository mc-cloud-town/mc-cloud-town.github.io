'use client';

import { useTranslation } from 'react-i18next';
import { SiteBar } from '#/dimensions/SiteBar';
import { SiteFooter } from '#/dimensions/SiteFooter';
import { InnerHeader } from '#/dimensions/InnerHeader';
import { HardwareSpecs } from '#/dimensions/HardwareSpecs';
import { NETHER_IMAGES } from '@/constants/scenes';

import '@/styles/dimensions/pages/hardware.css';

export default function Page() {
  const { t } = useTranslation();
  return (
    <div className='dim'>
      <SiteBar variant='inner' />
      <main>
        <InnerHeader
          image={NETHER_IMAGES[1]}
          dim='nether'
          crumbs={[
            { href: '/', label: t('dimensions.nav.homeShort') },
            { href: '/#nether', label: t('dimensions.nav.nether') },
            { label: t('dimensions.hardware.crumb') },
          ]}
          title={
            t('dimensions.hardware.title', { returnObjects: true }) as string[]
          }
          lead={t('hardware.description')}
          label={t('dimensions.dim.nether')}
        />
        <HardwareSpecs />
        <div className='next'>
          <span className='mono' data-t='note'>
            {t('dimensions.nextLabel')}
          </span>
          {/* a plain link on purpose: the shell takes the step from here, as a transition (PageTransitions) */}
          <a className='serif' href='/survivalProgress/' data-t='title'>
            {t('dimensions.hardware.next')} →
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
