import type { Metadata } from 'next';
import zhTW from '@/i18n/locales/zh_TW/translation.json';
import { breadcrumbJsonLd } from '@/lib/seo/jsonLd';
import { JoinPageView } from './PageView';

const CANONICAL = 'https://mc-ctec.org/join/';
const { join, respawn, nav } = zhTW.dimensions;

export const metadata: Metadata = {
  title: '如何加入雲鎮工藝｜紅石・建築・後勤審核制 Minecraft 伺服器 | CloudTown',
  description: `${join.lead}${join.way}`,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: join.title.join(''),
    description: join.lead,
    url: CANONICAL,
    images: [{ url: '/assets/join/CTEC_Lounge.webp' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: join.title.join(''),
    description: join.lead,
    images: ['/assets/join/CTEC_Lounge.webp'],
  },
};

const crumbs = [
  { href: '/', label: nav.homeShort },
  { href: '/#respawn', label: respawn.label },
  { label: nav.join },
];

export default function Page() {
  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(crumbs, CANONICAL)),
        }}
      />
      <JoinPageView />
    </>
  );
}
