'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { SiteBar } from '#/dimensions/SiteBar';
import { SiteFooter } from '#/dimensions/SiteFooter';
import { InnerHeader } from '#/dimensions/InnerHeader';
import { MemberRoster } from '#/dimensions/MemberRoster';

export default function Page() {
  const { t } = useTranslation();
  return (
    <div className='dim'>
      <SiteBar variant='inner' current='members' />
      <main>
        <InnerHeader
          image='/assets/members/CTEC_Members.webp'
          dim='end'
          crumbs={[
            { href: '/', label: t('dimensions.nav.homeShort') },
            { href: '/#end', label: t('dimensions.nav.end') },
            { label: t('dimensions.members.crumb') },
          ]}
          title={
            t('dimensions.members.title', { returnObjects: true }) as string[]
          }
          lead={t('dimensions.members.lead')}
          label={t('dimensions.dim.end')}
        />
        <MemberRoster />
        <div className='next'>
          <span className='mono' data-t='note'>
            {t('dimensions.nextLabel')}
          </span>
          <Link className='serif' href='/#respawn' data-t='title'>
            {t('dimensions.members.next')} →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
